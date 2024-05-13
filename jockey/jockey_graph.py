import functools
import json
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
from stirrups.video_text_generation import build_video_text_generation_worker
from stirrups.video_editing import build_video_editing_worker

class JockeyState(TypedDict):
    chat_history: Annotated[Sequence[Union[BaseMessage | AIMessage | HumanMessage | SystemMessage]], add_messages]
    next_worker: str


class Jockey(StateGraph):
    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    base_prompt: str
    supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI]
    worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]
    worker_instruction_generator: Runnable

    def __init__(self, supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       prompt: str) -> None:
        
        super().__init__(JockeyState)
        self.base_prompt = prompt
        self.supervisor_llm = supervisor_llm
        self.worker_llm = worker_llm
        core_workers = self.build_core_workers(worker_llm=worker_llm)
        self.workers = core_workers
        self.router = self.build_router()
        self.supervisor = self.build_supervisor()
        self.worker_instruction_generator = self.build_worker_instruction_generator()
        self.construct_graph()


    def build_core_workers(self, worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]) -> Sequence[AgentExecutor]:
        if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(worker_llm).__name__}")
        
        video_search_worker = build_video_search_worker(worker_llm)
        video_text_generation_worker = build_video_text_generation_worker(worker_llm)
        video_editing_worker = build_video_editing_worker(worker_llm)
        core_workers = [video_search_worker, video_text_generation_worker, video_editing_worker]
        return core_workers
        

    def build_router(self) -> Dict:
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
    

    def build_supervisor(self) -> Runnable:
        if any(map(lambda x: isinstance(self.supervisor_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: BaseChatOpenAI, AzureChatOpenAI. Got: {type(self.supervisor_llm).__name__}")

        supervisor_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above conversation which worker should act next? "
             "If you haven't called the planner worker for the current request(s) then heavily consider calling the planner worker. "
             "Additional, if you are in the middle of executing a plan and something unexpected has happened, like an error, " 
             "you can use the planner to create an updated plan and try again. "
             "Alternatively you could choose to REFLECT to move on to reflect and provide a final response if all tasks have been completed.")
        ])

        supervisor = supervisor_prompt | self.supervisor_llm.bind_functions(functions=[self.router], function_call="route") | JsonOutputFunctionsParser()
        return supervisor
    

    def build_worker_instruction_generator(self) -> Runnable:
        instructions_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "The worker: {next_worker} has been selected to act next. "
             "Given the above context, what simple natural language instructions should be passed to this worker? "
             "Remember a worker can only execute a single task per request. " 
             "Your response should be a single task for {next_worker} to complete.")
        ])
        worker_instruction_generator: Runnable = instructions_prompt | self.supervisor_llm
        worker_instruction_generator = worker_instruction_generator.with_config({"tags": ["instructions_generator"]})
        return worker_instruction_generator
    

    async def planner_node(self, state: JockeyState) -> Runnable:
        planner_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "You are a dedicated and competent planner for complex workflows and tasks especially those related to video editing. "
             "Considering the context above, devise a detailed step-by-step plan that will complete all parts of the request. "
             "As you plan you should consider how the output of one step will or could be used as input to later steps. "
             "You should construct your overall plan in natural language and think aloud about how and why you constructed this plan. "
             "Then construct a numbered list of steps to complete the plan you just created. "
             "Each step should consist of a single task and the correct worker to complete that task. "
             "The final step in your plan should always be reflection to ensure the plan went accordingly. "
             "If you are replanning after encountering an error adjust your approach accordingly. "
             "Limit your replanning efforts to 3 times or less if you keep encountering the same error.")
        ])
        planner_chain: Runnable = planner_prompt | self.supervisor_llm
        planner_chain = planner_chain.with_config({"tags": ["planner"]})
        planner_response = await planner_chain.ainvoke(state)
        planner_response = HumanMessage(content=planner_response.content, name="planner")
        return {"chat_history": [planner_response]}


    async def worker_node(self, state: JockeyState, worker: AgentExecutor, name):
        try:
            worker_instructions = await self.worker_instruction_generator.ainvoke(state)
            worker_instructions = HumanMessage(content=worker_instructions.content, name=f"{state['next_worker']}_instructions")
        except Exception as error:
            return {"chat_history": HumanMessage(
                content=f"Got the following error when generating {state['next_worker']} instructions: {error}", 
                name="instruction_generation_error"
            )}
        
        try:
            worker_response = await worker.ainvoke({"chat_history": [worker_instructions]})
        except Exception as error:
            return {"chat_history": HumanMessage(
                content=f"Got the following error from the {state['next_worker']} worker when executing the following instructions: {worker_instructions.content}",
                name="worker_error"
            )}
        
        worker_response = json.dumps(worker_response, indent=2)
        return {"chat_history": [worker_instructions, HumanMessage(content=worker_response, name=name)]}
    

    async def reflect_node(self, state: JockeyState):
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.base_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("system", "Given the above context provide your final response.")
        ])
        reflect_chain = reflect_prompt | self.supervisor_llm
        reflect_chain = reflect_chain.with_config({"tags": ["reflect"]})
        reflect_response = await reflect_chain.ainvoke(state)
        return {"chat_history": [reflect_response]}
    

    def construct_graph(self):
        worker_nodes = [
            functools.partial(self.worker_node, worker=worker, name=worker.name) for worker in self.workers   
        ]

        self.add_node("supervisor", self.supervisor)
        self.add_node("planner", self.planner_node)
        self.add_node("reflect", self.reflect_node)

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

    
def build_jockey_graph(custom_tools: Sequence[BaseTool] | None,
                       supervisor_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI], 
                       prompt: str):

    jockey_graph = Jockey(supervisor_llm, worker_llm, prompt)

    memory = AsyncSqliteSaver.from_conn_string(":memory:")

    jockey = jockey_graph.compile(checkpointer=memory)
    return jockey
