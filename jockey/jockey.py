import sys
import os
import uuid
import asyncio
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from rich import print
from rich.console import Console
from util import parse_langserve_events
from jockey_graph import build_jockey_graph
from langchain_core.messages import HumanMessage


load_dotenv()

def build_jockey():
    # Here we load all the required prompts for a Jockey instance.
    if len(sys.argv) < 3:
        supervisor_filepath = os.path.join(os.path.curdir, "prompts", "supervisor.md")
        planner_filepath = os.path.join(os.path.curdir, "prompts", "planner.md")
    elif os.path.isfile(os.path.join(os.path.curdir, "prompts", sys.argv[2])):
        supervisor_filepath = os.path.join(os.path.curdir, "prompts", sys.argv[2])
        planner_filepath = os.path.join(os.path.curdir, "prompts", sys.argv[3])

    with open(supervisor_filepath, "r") as supervisor_prompt_file:
        supervisor_prompt = supervisor_prompt_file.read()

    with open(planner_filepath, "r") as planner_prompt_file:
        planner_prompt = planner_prompt_file.read()


    # Here we construct all the LLMs for a Jockey instance.
    # Currently we only support OpenAI LLMs
    # Also note the class of LLM used for each component.
    planner_llm = supervisor_llm = AzureChatOpenAI(
        deployment_name="gpt-4",
        streaming=True,
        temperature=0,
        model_version="1106-preview",
        tags=["planner"]
    )

    supervisor_llm = AzureChatOpenAI(
        deployment_name="gpt-4",
        streaming=True,
        temperature=0,
        model_version="1106-preview",
        tags=["supervisor"]
    )

    worker_llm = AzureChatOpenAI(
        deployment_name="gpt-35-turbo-16k",
        streaming=True,
        temperature=0,
        model_version="0613",
        tags=["worker"]
    )

    return build_jockey_graph(
        planner_llm=planner_llm,
        planner_prompt=planner_prompt, 
        supervisor_llm=supervisor_llm, 
        supervisor_prompt=supervisor_prompt,
        worker_llm=worker_llm
    )

async def run_jockey():
    """This will easily construct a Jockey instance that we can interact with in the terminal for easy dev. work."""
    jockey = build_jockey()

    console = Console()

    session_id = uuid.uuid4()

    while True:
        console.print()
        user_input = console.input("[green]👤 Chat: ")

        user_input = [HumanMessage(content=user_input, name="user")]
        async for event in jockey.astream_events({"chat_history": user_input, "made_plan": False, "next_worker": None, "active_plan": None}, 
                                                 {"configurable": {"thread_id": session_id}}, version="v1"):
            parse_langserve_events(event)

        console.print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Missing argument: 'server' or 'local' as argument when launching.")
    elif sys.argv[1] == "local":
        asyncio.run(run_jockey())