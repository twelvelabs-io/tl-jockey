import functools
import json
import os
from typing import Annotated, Union, Sequence, Dict, TypedDict
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import Runnable
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


# TODO: Migrate to pydantic BaseModel -- fixing previously encountered errors when doing so.
class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""

    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    next_worker: Union[str, None]
    made_plan: bool = False
    active_plan: Union[str, None]
    feedback: Union[str, None]


class Jockey(StateGraph):
    """Conversational video agent designed to be modular and easily editable."""

    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    planner_prompt: str
    planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI]
    supervisor_prompt: str
    supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI]
    worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI]
    worker_instructor: Runnable
    _compiled_instance = None  # Class variable to store compiled instance

    def __init__(
        self,
        planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
        planner_prompt: str,
        supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
        supervisor_prompt: str,
        worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
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

        # collect all @tools from stirrups
        self.all_tools = collect_all_tools()
        self.tool_node = ToolNode(self.all_tools)
        print(f"[DEBUG] tool_node: {self.tool_node}")

        core_workers = self._build_core_workers()
        self.workers = core_workers
        self.router = self._build_router()
        self.supervisor = self._build_supervisor()
        self.worker_instructor = self._build_worker_instructor()
        self.construct_graph()
        self.__class__._compiled_instance = self

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
        """Builds the router that the supervisor uses to route to the appropriate node ina given state.

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
            MessagesPlaceholder(variable_name="chat_history"),
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

        planner_prompt = ChatPromptTemplate.from_messages([
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
        return {"chat_history": [planner_response], "active_plan": planner_response.content, "next_worker": "supervisor", "made_plan": True}

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
            # Use the instructor to generate a single task for the current plan and selected worker.
            worker_instructions = await self.worker_instructor.ainvoke(state)
            # We return the response from the instructor as a special human with the name of the instructor.
            # This helps with understanding historical context as the chat history grows.
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
        return {"chat_history": [worker_instructions, worker_response]}

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

    def should_continue(self, state: JockeyState) -> str:
        """Determines if the agent should continue or ask the human for feedback."""
        latest_state = state["chat_history"][-1]
        print(f"[DEBUG] latest_state: {latest_state}")
        # if not state["chat_history"][-1].tool_calls:
        #     return "end"

        # # if state.get("feedback", None) is not None:
        # if state.too
        #     return "ask_human"
        # else:
        #     return "continue"

    # We define a fake node to ask the human
    def _ask_human(self, state):
        pass

    def construct_graph(self):
        """Construct the actual Jockey agent as a graph."""
        # This arbitrarily generates worker nodes for each worker in the Jockey instance
        # We use `functools.partial` to generate a node that takes only a single argument, namely the graph state.
        worker_nodes = [functools.partial(self._worker_node, worker=worker) for worker in self.workers]

        # Create the pre-named nodes
        self.add_node("planner", self._planner_node)
        self.add_node("supervisor", self.supervisor)
        self.add_node("reflect", self._reflect_node)
        self.add_node("ask_human", self._ask_human)
        self.add_node("action", self.tool_node)

        # Since the supervisor decides/calls workers, we need to create edges between the supervisor and each worker.
        for worker, node in zip(self.workers, worker_nodes):
            self.add_node(worker.name, node)
            self.add_edge(worker.name, "supervisor")
            self.add_conditional_edges(
                worker.name,
                self.should_continue,
                {
                    # If `tools`, then we call the tool node.
                    "continue": "action",
                    # We may ask the human
                    "ask_human": "ask_human",
                    # Otherwise we finish.
                    "end": END,
                },
            )

        # Since the planner is needed for many user inputs, we need an edge between the planner and the supervisor.
        self.add_edge("planner", "supervisor")
        # self.add_edge("ask_human", "supervisor")  # if needed to go to next worker
        self.add_edge("ask_human", "planner")

        # We construct a node map as a dictionary where the keys values are the worker names.
        # So, if a worker's name is looked up, it routes to the name of the node -- which is the same.
        node_map = {worker.name: worker.name for worker in self.workers}
        # We add the pre-named nodes REFLECT and planner here.
        # NOTE: The node map keys MUST match the Enum in the router that is constructed for them to be actually reachable.
        node_map["REFLECT"] = "reflect"
        node_map["planner"] = "planner"

        # We need a special edge to the END node to ensure the agent execution terminates after the reflect node runs.
        self.add_edge("ask_human", "reflect")
        self.add_edge("reflect", END)

        # The conditional edges here are used to decide when to route to a given node
        # Since the router we constructed uses a JsonOutputFunctionsParser() we can expect: {"next_worker": <current_next_worker_enum_value>}
        # Because we also constructed the node map with the keys and values having the worker names this allows us to seamless route
        # to the correct worker based off of the value of `next_worker` in the graph state.
        self.add_conditional_edges(
            "supervisor",
            lambda x: x["next_worker"],
            node_map,
        )

        # Need to ensure that at the start of every agent execution, the supervisor node receives the input first.
        self.set_entry_point("supervisor")


def build_jockey_graph(
    planner_prompt: str,
    planner_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
    supervisor_prompt: str,
    supervisor_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
    worker_llm: Union[BaseChatOpenAI, AzureChatOpenAI],
) -> Jockey:
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
    )

    # This keeps track of conversation history and supports async.
    # also allows for checkpointing used in human-in-the-loop
    memory = MemorySaver()

    # Compile the StateGraph instance for this instance of Jockey.
    # list all the nodes that we have
    # nodes = jockey_graph.nodes.keys()
    # print(nodes)
    # breakpoint()

    worker_names: list[str] = [[worker.name] for worker in jockey_graph.workers]
    # jockey = jockey_graph.compile(checkpointer=memory, interrupt_before=["ask_human"])
    jockey = jockey_graph.compile(checkpointer=memory)
    # Save the graph visualization to a PNG file
    with open("graph.png", "wb") as f:
        f.write(jockey.get_graph().draw_mermaid_png())

    return jockey
