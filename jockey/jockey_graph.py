import functools
import json
import os
from typing import Annotated, Union, Sequence, Dict, List, Literal, Any
from typing_extensions import TypedDict
from langchain_openai.chat_models.base import ChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import Runnable
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from jockey.stirrups.video_search import VideoSearchWorker
from jockey.stirrups.video_text_generation import VideoTextGenerationWorker
from jockey.stirrups.video_editing import VideoEditingWorker
from langgraph.prebuilt import ToolNode
from jockey.stirrups import collect_all_tools
from langgraph.graph.state import CompiledStateGraph
from textwrap import dedent
from openai import OpenAI
from .model_config import OPENAI_MODELS
from pydantic import BaseModel, Field
from jockey.stirrups.video_search import MarengoSearchInput


class PlannerResponse(BaseModel):
    """Route to the appropriate node, and the tool to call"""

    route_to_node: Literal["planner", "video-search", "video-text-generation", "video-editing", "reflect"] = Field(
        description="""
        Available workers:
        <worker name="video-search", tools="simple-video-search">
            Purpose: Search for N clips/videos matching a natural language query
            Input: Index ID, search query, number of clips needed
            Output: List of clips with video IDs and timestamps (start/end in seconds)
        </worker>
        <worker name="video-editing", tools="combine-clips">
            Purpose: Edit and combine video clips
            Input: List of video IDs with start/end times
            Output: Filepath of edited video
        </worker>
        """,
    )
    tool_call: Literal["simple-video-search", "combine-clips", "none"] = Field(
        description="""
        Define the tool required by the route_to_node. If no tool is required, use 'none'.
        """,
    )
    plan: str = Field(
        description="""
        <instructions>
            1. Format steps ONLY as: "**worker-name**: Description"
            2. Do not include explanatory text - only output the planner steps
            3. You must always video-search before video-text-generation or video-editing
        </instructions>
        <rules>
            1. ALWAYS include Index ID in worker tasks
            2. ONLY use Index IDs provided by the user
            3. Each step must include complete, and concise context
        </rules>
        """,
    )


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
    tool_call: Union[str, None]
    feedback_history: List[FeedbackEntry]  # earlist [] latest


class Jockey(StateGraph):
    """Conversational video agent designed to be modular and easily editable."""

    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    planner_prompt: str
    planner_llm: Union[ChatOpenAI, AzureChatOpenAI]
    supervisor_prompt: str
    supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI]
    worker_llm: Union[ChatOpenAI, AzureChatOpenAI]
    worker_instructor: Runnable
    _compiled_instance = None  # Class variable to store compiled instance

    def __init__(
        self,
        planner_llm: Union[ChatOpenAI, AzureChatOpenAI],
        planner_prompt: str,
        instructor_prompt: str,
        supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI],
        supervisor_prompt: str,
        worker_llm: Union[ChatOpenAI, AzureChatOpenAI],
        reflect_llm: Union[ChatOpenAI, AzureChatOpenAI],
        reflect_prompt: str,
    ) -> None:
        """Constructs and compiles Jockey as a StateGraph instance.

        Args:
            planner_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.

            planner_prompt (str):
                String version of the system prompt for the planner.

            supervisor_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

            supervisor_prompt (str):
                String version of the system prompt for the supervisor.

            worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the worker nodes. It is recommended this be a GPT-4 class LLM or better.
        """

        super().__init__(state_schema=JockeyState)
        self.openai_client = OpenAI()
        self.reflect_llm = reflect_llm
        self.reflect_prompt = dedent(reflect_prompt)
        self.planner_prompt = planner_prompt
        self.instructor_prompt = instructor_prompt
        self.planner_llm = planner_llm
        self.supervisor_prompt = supervisor_prompt
        self.supervisor_llm = supervisor_llm
        self.worker_llm = worker_llm

        # collect all @tools from stirrups
        self.all_tools = collect_all_tools()
        self.tool_node = ToolNode(self.all_tools)

        self.workers = self._build_core_workers()
        self.router = self._build_router()
        self.supervisor = self._build_supervisor()
        self.worker_instructor = self._build_worker_instructor()
        self.construct_graph()

    def __getattr__(self, name: str) -> Any:
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"'State' object has no attribute '{name}'")

    def _build_core_workers(self) -> Sequence[AgentExecutor]:
        """Builds the core workers that are managed and called by the supervisor.

        Args:
            worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.
        Raises:
            TypeError: If the worker_llm instance type isn't currently supported.

        Returns:
            Sequence[AgentExecutor]: The core workers of a Jockey instance.
        """
        if any(map(lambda x: isinstance(self.worker_llm, x), [ChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: ChatOpenAI, AzureChatOpenAI. Got: {type(self.worker_llm).__name__}")

        video_search_worker = VideoSearchWorker.build_worker(worker_llm=self.worker_llm)
        video_text_generation_worker = VideoTextGenerationWorker.build_worker(worker_llm=self.worker_llm)
        video_editing_worker = VideoEditingWorker.build_worker(worker_llm=self.worker_llm)
        return [video_search_worker, video_text_generation_worker, video_editing_worker]

    def _build_router(self) -> Dict:
        """Builds the router that the supervisor uses to route to the appropriate node in a given state.

        Returns:
            Dict: The router definition adhering to the [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview).
        """
        router_options = [worker.name for worker in self.workers] + ["reflect", "supervisor", "planner"] + [w.name for w in self.workers]
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
        if any(map(lambda x: isinstance(self.supervisor_llm, x), [ChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Supervisor LLM must be one of: ChatOpenAI, AzureChatOpenAI. Got: {type(self.supervisor_llm).__name__}")

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
            route_to_node = await supervisor.ainvoke(state_with_defaults)
            return route_to_node

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
        # if any(map(lambda x: isinstance(self.planner_llm, x), [ChatOpenAI, AzureChatOpenAI])) is False:
        #     raise TypeError(f"Planner LLM must be one of: ChatOpenAI, AzureChatOpenAI. Got: {type(self.planner_llm).__name__}")

        # Add feedback context to the prompt
        # feedback_context = ""
        # if state.get("feedback_history"):
        #     feedback_context = "\n<feedback_history>\n"
        #     for i, entry in enumerate(state["feedback_history"], start=1):
        #         feedback_context += f"<feedback_history_{i}>\n"
        #         feedback_context += f"<previous_plan> {entry['node_content']}</previous_plan>\n"
        #         feedback_context += f"<human_feedback> {entry['feedback']}</human_feedback>\n"
        #         feedback_context += f"</feedback_history_{i}>\n"
        #     feedback_context += "</feedback_history>\n"
        #     feedback_context += "Please re-evaluate the active plan based on the feedback above."

        # escape {} in feedback_context by replacing with {{}}
        # https://python.langchain.com/docs/troubleshooting/errors/INVALID_PROMPT_INPUT/
        # feedback_context = feedback_context.replace("{", "{{").replace("}", "}}")

        completion = self.openai_client.beta.chat.completions.parse(
            model=OPENAI_MODELS["planner"],
            messages=[
                {"role": "system", "content": dedent(self.planner_prompt)},
                {"role": "user", "content": dedent(f"<chat_history>{state['chat_history']}</chat_history>")},
                {"role": "user", "content": dedent(f"<active_plan>{state['active_plan']}</active_plan>")},
            ],
            response_format=PlannerResponse,
        )

        planner_response: PlannerResponse = completion.choices[0].message.parsed
        # planner_response_ordered = planner_response.content.split("\n\n")
        # for i, pr in enumerate(planner_response_ordered):
        #     if pr.startswith("**"):
        #         pr = str(i + 1) + ". " + pr
        #         planner_response_ordered[i] = pr

        # planner_response.content = "\n".join(planner_response_ordered)

        # We return the response from the planner as a special human with the name of "planner".
        # This helps with understanding historical context as the chat history grows.
        print(f"[DEBUG] Planner response: {planner_response}")
        lc_planner_response = HumanMessage(content=planner_response.plan, name="planner")
        # We update the graph state to ensure the supervisor has access to the `active_plan` and is selected as the `next_worker`
        # The supervisor is also made aware that the planner was called via `made_plan`

        # feedback_history = state.get("feedback_history", [])
        # feedback_history.append({"node_content": planner_response.content, "node": "planner", "feedback": ""})

        return {
            "chat_history": [lc_planner_response],
            "active_plan": lc_planner_response,
            "next_worker": planner_response.route_to_node,
            "tool_call": planner_response.tool_call if planner_response.tool_call != "none" else None,
            "made_plan": True,
            # "feedback_history": feedback_history,
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
        worker_schemas = {"video-search": MarengoSearchInput}  # future: add more schemas here
        worker_to_stirrup = {
            "video-search": VideoSearchWorker,
            "video-text-generation": VideoTextGenerationWorker,
            "video-editing": VideoEditingWorker,
        }

        try:
            completion = self.openai_client.beta.chat.completions.parse(
                model=OPENAI_MODELS["worker"],
                messages=[
                    {"role": "system", "content": dedent(self.instructor_prompt)},
                    {"role": "user", "content": dedent(f"<active_plan>{state['active_plan']}</active_plan>")},
                    {"role": "user", "content": dedent(f"<tool_call>{state['tool_call']}</tool_call>")},
                ],
                response_format=worker_schemas[state["next_worker"]],
            )

            worker_inputs: Union[MarengoSearchInput] = completion.choices[0].message.parsed
            # print(f"[DEBUG] Worker inputs: {worker_inputs}")
        except Exception as error:
            raise error

        # let's make a call to the stirrup
        ai_message = None
        if state["tool_call"] and state["next_worker"] == "video-search":
            ai_message = AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": state["tool_call"],
                        "args": {
                            "query": worker_inputs.query,
                            "index_id": worker_inputs.index_id,
                            "top_n": worker_inputs.top_n,
                            "group_by": worker_inputs.group_by,
                            "search_options": worker_inputs.search_options,
                            "video_filter": worker_inputs.video_filter,
                        },
                        "id": f"call_{os.urandom(12).hex()}",
                        "type": "tool_call",
                    }
                ],
            )

        try:
            worker_response = await worker_to_stirrup[state["next_worker"]]._call_tools(ai_message)
        except Exception as error:
            print(f"[DEBUG] Error in worker_node: {error}")
            raise error

        worker_response = json.dumps(worker_response, indent=2)
        worker_response = HumanMessage(content=worker_response, name=f"{state['next_worker']}")

        return {
            "chat_history": [worker_response],
            "active_plan": state["active_plan"],
            "next_worker": "reflect",
        }

    async def _reflect_node(self, state: JockeyState) -> Dict:
        """The reflect node in the graph. This node reviews all the context for a given user input before generating a final output.

        Args:
            state (JockeyState): Current state of the graph.

        Returns:
            Dict: Updated state of the graph.
        """
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.reflect_prompt),
        ])
        reflect_chain = reflect_prompt | self.reflect_llm
        reflect_response = await reflect_chain.ainvoke({
            "active_plan": state["active_plan"] if state["active_plan"] else state["chat_history"][-1].content,
            "tool_call": state["tool_call"],
            "chat_history": state["chat_history"],
        })
        return {
            "chat_history": [reflect_response],
            "active_plan": None,
            "tool_call": None,
            "made_plan": False,
        }

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

        # go to the next node if the human feedback is empty
        # if not human_feedback_input[-1].get("feedback"):
        #     return {"next_worker": state.get("next_worker")}

        # Include feedback history in llm call
        # grab all feedback history for the current node
        # node_feedback_history = [entry for entry in state.get("feedback_history", []) if entry["node"] == current_node]
        # feedback_context = "Previous attempts for this task:\n"
        # if node_feedback_history:
        #     for i, entry in enumerate(node_feedback_history):
        #         node_content = entry["node_content"].strip().replace("\n", "").replace("\t", "")
        #         human_feedback = entry["feedback"].strip().replace("\n", "").replace("\t", "")

        #         feedback_context += (
        #             f"<feedback_history_{i + 1}>\n"
        #             f"<prev_llm_output>{node_content}</prev_llm_output>\n"
        #             f"<human_feedback>{human_feedback}</human_feedback>\n"
        #             f"</feedback_history_{i + 1}>\n"
        #         )
        # else:
        #     feedback_context = ""

        # make llm call
        messages = [
            ("human", f"<active_plan>{state['active_plan'].content}</active_plan>"),
            ("human", f"<node>{state['active_plan'].name}</node>"),
        ]

        response = await self.ask_human_llm.ainvoke(messages, stop=None, temperature=0)

        # try:
        #     route_to = AskHuman.from_response(response).route_to_node

        #     # update the state of the next_worker
        #     state["next_worker"] = current_node if route_to == "current_node" else route_to
        #     return {"next_worker": current_node if route_to == "current_node" else route_to}

        # except ValueError as e:
        #     print(f"Error parsing ask_human response: {e}")
        #     return "supervisor"

    def construct_graph(self):
        """Construct the actual Jockey agent as a graph."""

        # create nodes
        self.add_node("planner", self._planner_node)
        self.add_node("supervisor", self.supervisor)
        self.add_node("reflect", self._reflect_node)
        # self.add_node("ask_human", self.ask_human)
        # self.add_node("updater", self._updater_node)

        # connect workers to supervisor
        for worker in self.workers:
            worker_node = functools.partial(self._worker_node, worker=worker)
            self.add_node(worker.name, worker_node)
            self.add_edge(worker.name, "reflect")

        # core flow
        self.set_entry_point("supervisor")
        # self.add_edge("planner", "ask_human")
        self.add_edge("reflect", END)

        # Conditional routing based on supervisor node's output
        self.add_conditional_edges(
            "supervisor",
            lambda state: state["next_worker"],
            {
                "reflect": "reflect",
                "planner": "planner",
                # **{f"{worker.name}": worker.name for worker in self.workers},
            },
        )

        # Human feedback routing based on ask_human node's output
        self.add_conditional_edges(
            "planner",
            lambda state: state["next_worker"],
            {
                **{f"{worker.name}": worker.name for worker in self.workers},
                "reflect": "reflect",
            },
        )


def build_jockey_graph(
    planner_prompt: str,
    planner_llm: Union[ChatOpenAI, AzureChatOpenAI],
    supervisor_prompt: str,
    supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI],
    worker_llm: Union[ChatOpenAI, AzureChatOpenAI],
    instructor_prompt: str,
    reflect_llm: Union[ChatOpenAI, AzureChatOpenAI],
    reflect_prompt: str,
) -> CompiledStateGraph:
    """Convenience function for creating an instance of Jockey.

    Args:
        planner_prompt (str):
            String version of the system prompt for the planner.

        planner_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the planner node. It is recommended this be a GPT-4 class LLM.

        supervisor_prompt (str):
            String version of the system prompt for the supervisor.

        supervisor_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

        worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
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
        instructor_prompt=instructor_prompt,
        reflect_llm=reflect_llm,
        reflect_prompt=reflect_prompt,
    )

    memory = MemorySaver()
    jockey = jockey_graph.compile(checkpointer=memory)

    # Save the graph visualization to a PNG file
    with open("graph.png", "wb") as f:
        f.write(jockey.get_graph().draw_mermaid_png())

    return jockey
