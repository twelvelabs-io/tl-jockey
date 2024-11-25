import functools
import json
import os
from typing import Annotated, Union, Sequence, Dict, List, Literal, Any, Optional
from typing_extensions import TypedDict
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.runnables import Runnable
from langchain_core.messages.ai import AIMessage
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from jockey.stirrups.video_search import VideoSearchWorker
from jockey.stirrups.video_text_generation import VideoTextGenerationWorker
from jockey.stirrups.video_editing import VideoEditingWorker
from jockey.stirrups.errors import JockeyError, create_jockey_error_event
from jockey.util import parse_langchain_events_terminal
from langgraph.prebuilt import ToolNode
from jockey.stirrups import collect_all_tools
from langgraph.graph.state import CompiledStateGraph
from langchain_openai import ChatOpenAI

from pydantic import BaseModel, Field
from jockey.thread import thread
from langchain_core.callbacks.manager import adispatch_custom_event
# from langgraph.types import StreamWriter


class AskHuman(BaseModel):
    """Route to the appropriate node based on human feedback"""

    route_to_node: Literal["planner", "reflect", "video-search", "video-text-generation", "video-editing", "current_node", "end"] = Field(
        default="current_node",
        description="""
        First, evaluate whether the <active_plan> has been completed compared to the <feedback_history> and <human_feedback>.
        An empty <human_feedback> means the <active_plan> is complete, and the next node should be "reflect".

        If not, determine if the human feedback is:
        - Requesting changes/revisions -> route to current_node
        - approval of the current plan -> route to next appropriate worker based on the <active_plan> and latest <feedback_history> or "end" if the plan is complete

        If the <active_plan> has been completed:
        - <human_feedback> is approval of the current plan/step -> route to next appropriate worker based on the <active_plan> and latest <feedback_history> or "end" if the plan is complete
        """,
    )
    model_config = {"json_schema_extra": {"required": ["route_to_node"]}}

    @classmethod
    def from_response(cls, response):
        """Helper method to parse LangChain LLM response"""
        # Case 1: Direct Pydantic model (ideal case with strict=True)
        if isinstance(response, cls):
            return response

        # Case 2: AIMessage with tool_calls
        if hasattr(response, "additional_kwargs") and "tool_calls" in response.additional_kwargs:
            tool_call = response.additional_kwargs["tool_calls"][0]
            args = json.loads(tool_call["function"]["arguments"])
            return cls(**args)

        # Case 3: AIMessage with parsed content
        if hasattr(response, "additional_kwargs") and "parsed" in response.additional_kwargs:
            return response.additional_kwargs["parsed"]

        # Case 4: AIMessage with JSON string content
        if hasattr(response, "content"):
            try:
                data = json.loads(response.content)
                return cls(**data)
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Unable to parse response type: {type(response)}\nResponse: {response}")


class FeedbackEntry(TypedDict):
    node_content: str
    node: str
    feedback: str


class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""

    next_worker: Union[str, None]
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    made_plan: bool = False
    active_plan: Union[str, HumanMessage, None]
    feedback_history: List[FeedbackEntry]  # earlist [] latest


class Jockey(StateGraph):
    """Conversational video agent designed to be modular and easily editable."""

    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    planner_prompt: str
    planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI, ChatOpenAI]
    supervisor_prompt: str
    supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI, ChatOpenAI]
    worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI, ChatOpenAI]
    worker_instructor: Runnable
    _compiled_instance = None  # Class variable to store compiled instance

    def __init__(
        self,
        planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
        planner_prompt: str,
        supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
        supervisor_prompt: str,
        worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
        ask_human_llm: Union[AzureChatOpenAI, ChatOpenAI],
    ) -> None:
        """Constructs and compiles Jockey as a StateGraph instance.

        Args:
            planner_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.

            planner_prompt (str):
                String version of the system prompt for the planner.

            supervisor_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

            supervisor_prompt (str):
                String version of the system prompt for the supervisor.

            worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the worker nodes. It is recommended this be a GPT-4 class LLM or better.
        """

        super().__init__(state_schema=JockeyState)
        self.planner_prompt = planner_prompt
        self.planner_llm = planner_llm
        self.supervisor_prompt = supervisor_prompt
        self.supervisor_llm = supervisor_llm
        self.worker_llm = worker_llm
        self.ask_human_llm = ask_human_llm

        # collect all @tools from stirrups
        self.all_tools = collect_all_tools()
        self.tool_node = ToolNode(self.all_tools)

        core_workers = self._build_core_workers()
        self.workers = core_workers
        self.router = self._build_router()
        self.supervisor = self._build_supervisor()
        self.worker_instructor = self._build_worker_instructor()
        self.construct_graph()

    @classmethod
    def get_compiled_instance(cls):
        """Get the current compiled Jockey graph instance."""
        if cls._compiled_instance is None:
            raise RuntimeError("Compiled Jockey graph has not been initialized")
        return cls._compiled_instance

    def _build_core_workers(self) -> Sequence[AgentExecutor]:
        """Builds the core workers that are managed and called by the supervisor.

        Args:
            worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.
        Raises:
            TypeError: If the worker_llm instance type isn't currently supported.

        Returns:
            Sequence[AgentExecutor]: The core workers of a Jockey instance.
        """
        if any(map(lambda x: isinstance(self.worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(self.worker_llm).__name__}")

        video_search_worker = VideoSearchWorker.build_worker(worker_llm=self.worker_llm)
        video_text_generation_worker = VideoTextGenerationWorker.build_worker(worker_llm=self.worker_llm)
        video_editing_worker = VideoEditingWorker.build_worker(worker_llm=self.worker_llm)
        core_workers = [video_search_worker, video_text_generation_worker, video_editing_worker]

        # print(f"[DEBUG] Core workers: {core_workers}")
        # exit()
        return core_workers

    def _build_router(self) -> Dict:
        """Builds the router that the supervisor uses to route to the appropriate node in a given state.

        Returns:
            Dict: The router definition adhering to the [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview).
        """
        router_options = [worker.name for worker in self.workers] + ["REFLECT", "supervisor", "planner"]
        router = {
            "name": "route",
            "description": "Determine whether to choose the next active worker or reflect.",
            "parameters": {
                "title": "routeSchema",
                "type": "object",
                "properties": {
                    "next_worker": {
                        "title": "Next Worker",
                        "anyOf": [
                            {"enum": router_options},
                        ],
                    },
                },
                "required": ["next_worker"],
            },
        }
        return router

    def _build_supervisor(self) -> Runnable:
        """Builds the supervisor which acts as the routing agent.

        Raises:
            TypeError: If the supervisor_llm instance type isn't currently supported.

        Returns:
            Runnable: The supervisor of the Jockey instance.
        """
        if any(map(lambda x: isinstance(self.supervisor_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Supervisor LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(self.supervisor_llm).__name__}")

        supervisor_prompt = ChatPromptTemplate.from_messages([("system", self.supervisor_prompt), MessagesPlaceholder(variable_name="chat_history")])

        # This constructs the supervisor agent and determines the possible node routing.
        # Note: The JsonOutputFunctionsParser forces the response from invoking this agent into the format of {"next_worker": ROUTER_ENUM}
        supervisor = (
            supervisor_prompt | self.supervisor_llm.bind_functions(functions=[self.router], function_call="route") | JsonOutputFunctionsParser()
        )

        # Wrap the supervisor to handle missing state variables
        async def wrapped_supervisor(state: JockeyState) -> Dict:
            state_with_defaults = {
                "chat_history": state["chat_history"],
                "active_plan": state.get("active_plan", "No active plan"),
                "made_plan": state.get("made_plan", False),
            }
            return await supervisor.ainvoke(state_with_defaults)

        return wrapped_supervisor

    def _build_worker_instructor(self) -> Runnable:
        """Constructs the worker_instructor which generates singular tasks for a given step in a plan generated by the planner node.

        Returns:
            Runnable: The worker_instructor of the Jockey instance.
        """
        with open(os.path.join(os.path.dirname(__file__), "prompts", "instructor.md"), "r") as instructor_prompt_file:
            instructor_system_prompt = instructor_prompt_file.read()

        instructor_prompt = ChatPromptTemplate.from_messages([
            ("system", instructor_system_prompt),
            ("human", "{active_plan}"),
            ("human", "{next_worker}"),
        ])
        worker_instructor: Runnable = instructor_prompt | self.planner_llm

        # The tag here is used for parsing events to the console when running locally.
        # We assign a separate tag since we are using the planner_llm which should already have a tag.
        worker_instructor = worker_instructor.with_config({"tags": ["instructor"]})
        return worker_instructor

    async def _planner_node(self, state: JockeyState) -> Dict:
        """The planner_node in the StateGraph instance. The planner is responsible to generating a plan for a given user request.

        Args:
            state (JockeyState): Current state of the graph.

        Raises:
            TypeError: If the planner_llm instance type isn't currently supported.

        Returns:
            Dict: Updated state of the graph.
        """
        if any(map(lambda x: isinstance(self.planner_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Planner LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(self.planner_llm).__name__}")

        # Add feedback context to the prompt
        feedback_context = ""
        if state.get("feedback_history"):
            feedback_context = "\n<feedback_history>\n"
            for i, entry in enumerate(state["feedback_history"], start=1):
                feedback_context += f"{i}. <previous_plan> {entry['node_content']}\n </previous_plan>\n"
                feedback_context += f"{i}. <human_feedback> {entry['feedback']}\n </human_feedback>\n"
            feedback_context += "</feedback_history>\n"
            feedback_context += "Please re-evaluate the active plan based on the feedback above."

        # escape {} in feedback_context by replacing with {{}}
        # https://python.langchain.com/docs/troubleshooting/errors/INVALID_PROMPT_INPUT/
        feedback_context = feedback_context.replace("{", "{{").replace("}", "}}")

        # Create the prompt template with properly escaped system messages
        planner_prompt = ChatPromptTemplate.from_messages([
            ("system", feedback_context),
            ("system", self.planner_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
        ])
        planner_chain: Runnable = planner_prompt | self.planner_llm
        planner_response = await planner_chain.ainvoke(state)

        # We return the response from the planner as a special human with the name of "planner".
        # This helps with understanding historical context as the chat history grows.
        planner_response = HumanMessage(content=planner_response.content, name="planner")
        # We update the graph state to ensure the supervisor has access to the `active_plan` and is selected as the `next_worker`
        # The supervisor is also made aware that the planner was called via `made_plan`

        feedback_history = state.get("feedback_history", [])
        feedback_history.append({"node_content": planner_response.content, "node": "planner", "feedback": ""})

        return {
            "chat_history": [planner_response],
            "active_plan": planner_response,
            "next_worker": "video-search",
            "made_plan": True,
            "feedback_history": feedback_history,
        }

    async def _worker_node(self, state: JockeyState, worker: Runnable) -> Dict:
        """A worker_node in the StateGraph instance. Workers are responsible for directly calling tools in their domains.
        This node isn't used directly but is wrapped with a functools.partial call.

        Args:
            state (JockeyState): Current state of the graph.
            worker (Runnable): The actual worker Runnable.

        Returns:
            Dict: Updated state of the graph.
        """

        try:
            # see build_worker_instructor() for more details for the instructor prompt
            # note that we only need to pass in active_plan (MessagesPlaceholder) and next_worker (see prompts/instructor.md)
            worker_instructions = await self.worker_instructor.ainvoke({"active_plan": state["active_plan"], "next_worker": state["next_worker"]})
            worker_instructions = HumanMessage(content=worker_instructions.content, name="instructor")
        except JockeyError as error:
            raise error
        except Exception as error:
            error_event = create_jockey_error_event(error=error)
            await parse_langchain_events_terminal(error_event)
            raise error

        try:
            # This sends the single task generated by the instructor to the selected worker.
            worker_response = await worker.ainvoke({"worker_task": [worker_instructions]})
        except JockeyError as error:
            raise error
        except Exception as error:
            error_event = create_jockey_error_event(error=error)
            await parse_langchain_events_terminal(error_event)
            raise error
        # Convert response to string first to ensure it can be used as content for a HumanMessage
        worker_response = json.dumps(worker_response, indent=2)
        # We return the response from the worker as a special human with the name of the worker.
        # This helps with understanding historical context as the chat history grows.
        worker_response = HumanMessage(content=worker_response, name=f"{state['next_worker']}")

        # Update the feedback history
        feedback_history: List[FeedbackEntry] = state.get("feedback_history", [])
        feedback_history.append({"node_content": worker_response.content, "node": state["next_worker"], "feedback": ""})

        # return {"chat_history": [worker_instructions, worker_response], "feedback_history": feedback_history}
        return {
            "chat_history": [worker_instructions, worker_response],
            "feedback_history": feedback_history,
            # "next_worker": ,
        }

    async def _reflect_node(self, state: JockeyState) -> Dict:
        """The reflect node in the graph. This node reviews all the context for a given user input before generating a final output.

        Args:
            state (JockeyState): Current state of the graph.

        Returns:
            Dict: Updated state of the graph.
        """
        # TODO: Create specific reflection prompt -- this is just a placeholder.
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.supervisor_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above context provide your final response."),
        ])
        reflect_chain = reflect_prompt | self.supervisor_llm
        # We add a tag for easier parsing of events.
        reflect_chain = reflect_chain.with_config({"tags": ["reflect"]})
        reflect_response = await reflect_chain.ainvoke(state)
        # NOTE: We reset the `active_plan` and `made_plan` variables of teh graph state for extra safety.

        return {"chat_history": [reflect_response], "active_plan": None, "made_plan": False}

    def _ask_human_node(state):
        return state.get("route_to_node", "planner")

    async def ask_human(self, state: JockeyState) -> str:
        """
        This is a routing node. It returns the next node to route to based on the human feedback.
        Routes feedback to the current node by default.
        Only routes to a different node in very specific cases (e.g., explicit "help" command)."""
        # Initial state check
        if not state:
            return "planner"

        latest_chat_history = state.get("chat_history", [])[-1]
        current_node = latest_chat_history.name  # Get the node that called ask_human

        # confirm that we have user input sent from the cli or client
        human_feedback_input = state.get("feedback_history", [])
        if not human_feedback_input:
            raise ValueError("No feedback provided to ask_human node")

        # Dispatch custom event for human feedback received
        # await adispatch_custom_event(
        #     "human_feedback_received",
        #     {
        #         "current_node": current_node,
        #         "feedback": human_feedback_input[-1].get("feedback", ""),
        #         "node_content": human_feedback_input[-1].get("node_content", ""),
        #     },
        #     config={
        #         "callbacks": thread["callbacks"],
        #         "metadata": {"source": "jockey"},
        #         "tags": ["jockey", "custom_event"],
        #     },
        # )

        # go to the next node if the human feedback is empty
        if not human_feedback_input[-1].get("feedback"):
            return state["next_worker"]

        # Include feedback history in llm call
        # grab all feedback history for the current node
        node_feedback_history = [entry for entry in state.get("feedback_history", []) if entry["node"] == current_node]
        feedback_context = "Previous attempts for this task:\n"
        if node_feedback_history:
            for i, entry in enumerate(node_feedback_history):
                node_content = entry["node_content"].strip().replace("\n", "").replace("\t", "")
                human_feedback = entry["feedback"].strip().replace("\n", "").replace("\t", "")

                feedback_context += (
                    f"<feedback_history_{i + 1}>\n"
                    f"<prev_llm_output>{node_content}</prev_llm_output>\n"
                    f"<human_feedback>{human_feedback}</human_feedback>\n"
                    f"</feedback_history_{i + 1}>\n"
                )
        else:
            feedback_context = ""

        # make llm call
        messages = [
            ("human", f"current_node: {current_node}\n{feedback_context}"),
            ("human", f"<active_plan>{state['active_plan']}</active_plan>"),
        ]

        response = await self.ask_human_llm.ainvoke(messages, stop=None, temperature=0)

        try:
            route_to = AskHuman.from_response(response).route_to_node
            # # Dispatch custom event for routing decision
            # await adispatch_custom_event("askh_human_routing", {"from_node": current_node, "route_to": route_to}, config=thread)
            return current_node if route_to == "current_node" else route_to

        except ValueError as e:
            # Dispatch custom event for error
            # await adispatch_custom_event("ask_human_error", {"error": str(e), "current_node": current_node}, config=thread)
            print(f"Error parsing ask_human response: {e}")
            return "supervisor"

    def construct_graph(self):
        """Construct the actual Jockey agent as a graph."""

        # create nodes
        self.add_node("planner", self._planner_node)
        self.add_node("supervisor", self.supervisor)
        self.add_node("reflect", self._reflect_node)
        self.add_node("ask_human", self.ask_human)

        # connect workers to supervisor
        for worker in self.workers:
            worker_node = functools.partial(self._worker_node, worker=worker)
            self.add_node(worker.name, worker_node)
            self.add_edge(worker.name, "supervisor")

        # core flow
        self.set_entry_point("supervisor")
        self.add_edge("planner", "ask_human")
        self.add_edge("reflect", END)

        # Conditional routing based on supervisor node's output
        self.add_conditional_edges("supervisor", lambda state: state["next_worker"], {"REFLECT": "reflect", "planner": "planner"})

        # Human feedback routing based on ask_human node's output
        self.add_conditional_edges(
            "ask_human",
            self.ask_human,
            {
                "planner": "planner",
                "end": END,
                "reflect": "reflect",
                **{f"{worker.name}": worker.name for worker in self.workers},
            },
        )


def build_jockey_graph(
    planner_prompt: str,
    planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
    supervisor_prompt: str,
    supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
    worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
    ask_human_llm: Union[BaseChatOpenAI, AzureChatOpenAI, ChatOpenAI],
) -> CompiledStateGraph:
    """Convenience function for creating an instance of Jockey.

    Args:
        planner_prompt (str):
            String version of the system prompt for the planner.

        planner_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the planner node. It is recommended this be a GPT-4 class LLM.

        supervisor_prompt (str):
            String version of the system prompt for the supervisor.

        supervisor_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

        worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.

    Returns:
        Jockey: An instance of Jockey a video agent.
    """

    # Simple call to instantiate a Jockey instance.
    jockey_graph = Jockey(
        planner_prompt=planner_prompt,
        planner_llm=planner_llm,
        supervisor_prompt=supervisor_prompt,
        supervisor_llm=supervisor_llm,
        worker_llm=worker_llm,
        ask_human_llm=ask_human_llm,
    )

    memory = MemorySaver()
    jockey = jockey_graph.compile(checkpointer=memory, interrupt_before=["ask_human"])

    # Save the graph visualization to a PNG file
    with open("graph.png", "wb") as f:
        f.write(jockey.get_graph().draw_mermaid_png())

    return jockey
