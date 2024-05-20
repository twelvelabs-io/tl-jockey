import functools
import json
from typing import Annotated, Union, Sequence, Dict, TypedDict
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import Runnable
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.aiosqlite import AsyncSqliteSaver
from stirrups.video_search import VideoSearchWorker
from stirrups.video_text_generation import VideoTextGenerationWorker
from stirrups.video_editing import VideoEditingWorker


class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    next_worker: str | None = None
    made_plan: bool = False
    active_plan: str | None = None


class Jockey(StateGraph):
    """Conversational video agent designed to be modular and easily editable."""
    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    planner_prompt: str
    planner_llm: Union[BaseChatOpenAI | AzureChatOpenAI]
    supervisor_prompt: str
    supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI]
    worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]
    worker_instructor: Runnable

    def __init__(self, 
                 planner_llm: Union[BaseChatOpenAI | AzureChatOpenAI],
                 planner_prompt: str,
                 supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                 supervisor_prompt: str,
                 worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]) -> None:
        """Constructs and compiles Jockey as a StateGraph instance.

        Args:
            planner_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]): 
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM.

            planner_prompt (str): 
                String version of the system prompt for the planner.

            supervisor_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]): 
                The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

            supervisor_prompt (str): 
                String version of the system prompt for the supervisor.

            worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]): 
                The LLM used for the planner node. It is recommended this be a GPT-3.5 class LLM or better.
        """
        
        super().__init__(JockeyState)
        self.planner_prompt = planner_prompt
        self.planner_llm = planner_llm
        self.supervisor_prompt = supervisor_prompt
        self.supervisor_llm = supervisor_llm
        self.worker_llm = worker_llm
        core_workers = self._build_core_workers()
        self.workers = core_workers
        self.router = self._build_router()
        self.supervisor = self._build_supervisor()
        self.worker_instructor = self._build_worker_instructor()
        self.construct_graph()


    def _build_core_workers(self) -> Sequence[AgentExecutor]:
        """Builds the core workers that are managed and called by the supervisor.

        Args:
            worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-3.5 class LLM or better.
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

        supervisor_prompt = ChatPromptTemplate.from_messages([
            ("system", self.supervisor_prompt),
            MessagesPlaceholder(variable_name="chat_history")
        ])

        # This constructs the supervisor agent and determines the possible node routing.
        # Note: The JsonOutputFunctionsParser forces the response from invoking this agent into the format of {"next_worker": ROUTER_ENUM}
        supervisor = supervisor_prompt | self.supervisor_llm.bind_functions(functions=[self.router], function_call="route") | JsonOutputFunctionsParser()
        return supervisor
    

    def _build_worker_instructor(self) -> Runnable:
        """Constructs the worker_instructor which generates singular tasks for a given step in a plan generated by the planner node.

        Returns:
            Runnable: The worker_instructor of the Jockey instance.
        """
        with open("prompts/instructor.md", "r") as instructor_prompt_file:
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
        return {"chat_history": [planner_response], "active_plan": planner_response.content, "next_worker": "supervisor", "made_plan": True}


    async def _worker_node(self, state: JockeyState, worker: Runnable):
        """A worker_node in the StateGraph instance. Workers are responsible for directly calling tools in their domains.
        This node isn't used directly but is wrapped with a functools.partial call.

        Args:
            state (JockeyState): Current state of the graph.
            worker (Runnable): The actual worker Runnable.
        """
        try:
            # Use the instructor to generate a single task for the current plan and selected worker.
            worker_instructions = await self.worker_instructor.ainvoke(state)
            # We return the response from the instructor as a special human with the name of the instructor.
            # This helps with understanding historical context as the chat history grows.
            worker_instructions = HumanMessage(content=worker_instructions.content, name="instructor")
        except Exception as error:
            return {"chat_history": HumanMessage(
                content=f"Got the following error when generating {state['next_worker']} instructions: {error}", 
                name="instruction_generation_error"
            )}

        try:
            # This sends the single task generated by the instructor to the selected worker.
            worker_response = await worker.ainvoke({"worker_task": [worker_instructions]})
        except Exception as error:
            return {"chat_history": HumanMessage(
                content=f"Got the following error from the {state['next_worker']} worker when executing the following instructions: {worker_instructions.content}",
                name="worker_error"
            )}
        
        # Convert response to string first to ensure it can be used as content for a HumanMessage
        worker_response = json.dumps(worker_response, indent=2)
        # We return the response from the worker as a special human with the name of the worker.
        # This helps with understanding historical context as the chat history grows.
        worker_response = HumanMessage(content=worker_response, name=f"{state['next_worker']}")
        return {"chat_history": [worker_instructions, worker_response]}
    

    async def _reflect_node(self, state: JockeyState):
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.supervisor_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above context provide your final response.")
        ])
        reflect_chain = reflect_prompt | self.supervisor_llm
        reflect_chain = reflect_chain.with_config({"tags": ["reflect"]})
        reflect_response = await reflect_chain.ainvoke(state)
        return {"chat_history": [reflect_response], "active_plan": None, "made_plan": False}
    

    def construct_graph(self):
        worker_nodes = [
            functools.partial(self._worker_node, worker=worker) for worker in self.workers   
        ]

        self.add_node("planner", self._planner_node)
        self.add_node("supervisor", self.supervisor)
        self.add_node("reflect", self._reflect_node)

        for worker, node in zip(self.workers, worker_nodes):
            self.add_node(worker.name, node)
            self.add_edge(worker.name, "supervisor")

        self.add_edge("planner", "supervisor")

        node_map = {worker.name: worker.name for worker in self.workers}
        node_map["REFLECT"] = "reflect"
        node_map["planner"] = "planner"
        
        self.add_edge("reflect", END)
        self.add_conditional_edges(
            "supervisor",
            lambda x: x["next_worker"],
            node_map,
        )

        self.add_conditional_edges(
            "planner",
            lambda _: "supervisor",
            {"supervisor": "supervisor"}
        )

        self.set_entry_point("supervisor")

    
def build_jockey_graph(planner_prompt: str,
                       planner_llm: Union[BaseChatOpenAI | AzureChatOpenAI],
                       supervisor_prompt: str,
                       supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]):

    jockey_graph = Jockey(
        planner_prompt=planner_prompt,
        planner_llm=planner_llm,
        supervisor_prompt=supervisor_prompt,
        supervisor_llm=supervisor_llm, 
        worker_llm=worker_llm)

    memory = AsyncSqliteSaver.from_conn_string(":memory:")

    jockey = jockey_graph.compile(checkpointer=memory)
    return jockey
