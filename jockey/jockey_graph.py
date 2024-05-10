import functools
from typing import Annotated, Type, Union, Sequence, Dict, TypedDict
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import ToolMessage, BaseMessage, AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import Runnable
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END, add_messages
from langchain_core.pydantic_v1 import BaseModel
from langgraph.prebuilt.tool_executor import ToolExecutor
from langgraph.prebuilt import ToolInvocation
from langchain.tools import BaseTool, StructuredTool
from langchain_core.pydantic_v1 import BaseModel, Field
from langgraph.checkpoint.aiosqlite import AsyncSqliteSaver
from stirrups.video_search import build_video_search_worker
from jockey_tools import combine_clips, remove_segment

class JockeyState(TypedDict):
    chat_history: Annotated[Sequence[Union[BaseMessage | AIMessage | HumanMessage | SystemMessage]], add_messages]
    next: str


class Jockey(StateGraph):
    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    base_prompt: str
    supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI]

    def __init__(self, supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       prompt: str) -> None:
        
        super().__init__(JockeyState)
        self.base_prompt = prompt
        self.supervisor_llm = supervisor_llm
        core_workers = self.build_core_workers(worker_llm=worker_llm)
        self.workers = core_workers
        self.router = self.build_router()
        self.supervisor = self.build_supervisor()
        self.construct_graph()


    def build_core_workers(self, worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]) -> Sequence[AgentExecutor]:
        if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(worker_llm).__name__}")
        
        video_search_worker = build_video_search_worker(worker_llm)
        core_workers = [video_search_worker]
        return core_workers
        

    def build_router(self) -> Dict:
        router_options = [worker.name for worker in self.workers] + ["REFLECT"]
        router = {
            "name": "route",
            "description": "Determine whether to choose the next active worker or reflect.",
            "parameters": {
                "title": "routeSchema",
                "type": "object",
                "properties": {
                    "next": {
                        "title": "Next",
                        "anyOf": [
                            {"enum": router_options},
                        ],
                    },
                },
                "required": ["next"],
            },
        }
        return router
    

    def build_supervisor(self) -> Runnable:
        if any(map(lambda x: isinstance(self.supervisor_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(self.supervisor_llm).__name__}")
        worker_names = str.join(", ", [worker.name for worker in self.workers])
        supervisor_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above conversation which worker should act next?"
            "Alternatively you could choose to REFLECT to move on to reflect and provide a final response.")
        ]).partial(workers=worker_names)
        supervisor = supervisor_prompt | self.supervisor_llm.bind_functions(functions=[self.router], function_call="route") | JsonOutputFunctionsParser()
        return supervisor
    

    async def worker_node(self, state: JockeyState, worker: AgentExecutor, name):
        worker_response = await worker.ainvoke(state)
        return {"chat_history": HumanMessage(content=str(worker_response), name=name)}
    

    async def reflect_node(self, state):
        worker_names = str.join(", ", [worker.name for worker in self.workers])
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above context provide your final response.")
        ]).partial(workers=worker_names)
        reflect_chain = reflect_prompt | self.supervisor_llm
        worker_response = await reflect_chain.ainvoke(state)
        return {"chat_history": [worker_response]}
    

    def construct_graph(self):
        worker_nodes = [
            functools.partial(self.worker_node, worker=worker, name=worker.name) for worker in self.workers   
        ]

        self.add_node("supervisor", self.supervisor)
        self.add_node("reflect", self.reflect_node)

        for worker, node in zip(self.workers, worker_nodes):
            self.add_node(worker.name, node)
            self.add_edge(worker.name, "supervisor")

        node_map = {worker.name: worker.name for worker in self.workers}
        node_map["REFLECT"] = "reflect"
        
        self.add_edge("reflect", END)
        self.add_conditional_edges(
            "supervisor",
            lambda x: x["next"],
            node_map,
        )

        self.set_entry_point("supervisor")

    
def build_jockey_graph(custom_tools: Sequence[BaseTool] | None,
                       supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       prompt: str):

    jockey_graph = Jockey(supervisor_llm, worker_llm, prompt)

    memory = AsyncSqliteSaver.from_conn_string(":memory:")

    jockey = jockey_graph.compile(checkpointer=memory)
    return jockey
