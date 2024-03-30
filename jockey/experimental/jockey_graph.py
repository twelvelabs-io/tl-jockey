import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.messages import BaseMessage, HumanMessage
from rich import print
from rich.console import Console
from jockey.jockey_tools import (
    video_search,
    download_videos,
    combine_clips,
    remove_segment
)
import operator
import functools
from langgraph.graph import StateGraph, END
from typing import Annotated, Sequence, TypedDict, Callable, List
from langchain.tools import BaseTool


load_dotenv()


def create_agent(llm: ChatOpenAI, tools: list, system_prompt: str):
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    agent = create_openai_tools_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools)
    return executor


async def agent_node(state, agent, name):
    result = await agent.ainvoke(state)
    return {"messages": [HumanMessage(content=result["output"], name=name)]}


tools: List[BaseTool] = [video_search,
                         download_videos, combine_clips, remove_segment]
members = [tool.name for tool in tools]

llm = ChatOpenAI(
    model_name="gpt-4-turbo-preview",
    temperature=0.01,
    max_tokens=1000,
    streaming=True,
)

system_prompt = ("You are Jockey, a supervisor tasked with managing a conversation between the"
                 " following workers:  {members}. Given the following user request,"
                 " respond with the worker to act next. Each worker will perform a"
                 " task and respond with their results and status. When finished,"
                 " respond with FINISH.")
options = ["FINISH"] + members
function_def = {
    "name": "route",
    "description": "Select the next role.",
    "parameters": {
        "title": "routeSchema",
        "type": "object",
        "properties": {
            "next": {"title": "Next", "anyOf": [{"enum": options}]},
        },
        "required": ["next"],
    },
}
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="messages"),
    ("system", "Given the conversation above, who should act next?"
     " Or should we FINISH? Select one of: {options}"),
]).partial(options=str(options), members=", ".join(members))

supervisor_chain = (prompt
                    | llm.bind_functions(functions=[function_def], function_call="route")
                    | JsonOutputFunctionsParser())


class JockeyState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str


tool_agents = {}
for tool in tools:
    tool_agents[tool.name] = create_agent(
        llm, [tool], f"You are a {tool.name} agent with access to the {tool.name} tool that does {tool.description}.")

tool_nodes = {tool.name: functools.partial(
    agent_node, agent=tool_agents[tool.name], name=tool.name) for tool in tools}

workflow = StateGraph(JockeyState)
for tool_name, tool_node in tool_nodes.items():
    workflow.add_node(tool_name, tool_node)
workflow.add_node("Jockey", supervisor_chain)

for member in members:
    workflow.add_edge(member, "Jockey")

conditional_map = {k: k for k in members}
conditional_map["FINISH"] = END
workflow.add_conditional_edges(
    "Jockey", lambda x: x["next"], conditional_map)
workflow.set_entry_point("Jockey")

graph = workflow.compile()


async def run_jockey():
    console = Console()

    while True:
        user_input = console.input("[green]Chat: ")

        console.print(f"[cyan]Jockey: ", end="")

        async for s in graph.astream(
            {"messages": [HumanMessage(content=user_input)]},
            {"recursion_limit": 100},
        ):
            if "__end__" not in s:
                print(s)
                print("----")

if __name__ == "__main__":
    asyncio.run(run_jockey())
