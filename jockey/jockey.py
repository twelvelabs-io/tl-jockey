import sys
import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from rich import print
from rich.console import Console
from util import parse_langserve_events
from fastapi import FastAPI
from jockey_graph import build_jockey_graph
from langchain_core.messages import HumanMessage


load_dotenv()

def build_jockey():
    if len(sys.argv) < 3:
        prompt_filepath = os.path.join(os.path.curdir, "prompts", "jockey_base.txt")
    elif os.path.isfile(os.path.join(os.path.curdir, "prompts", sys.argv[2])):
        prompt_filepath = os.path.join(os.path.curdir, "prompts", sys.argv[2])

    with open(prompt_filepath, "r") as prompt_file:
        prompt = prompt_file.read()

    supervisor_llm = AzureChatOpenAI(
        deployment_name="gpt-4",
        streaming=True,
        temperature=0.01,
        model_version="1106-preview",
        tags=["supervisor"]
    )

    worker_llm = AzureChatOpenAI(
        deployment_name="gpt-35-turbo-16k",
        streaming=True,
        temperature=0.01,
        model_version="0613",
        tags=["worker"]
    )

    return build_jockey_graph(None, supervisor_llm, worker_llm, prompt)

async def run_jockey():
    jockey = build_jockey()

    console = Console()

    while True:
        user_input = console.input("[green]👤 Chat: ")

        console.print(f"[cyan]🏇 Jockey: ", end="")

        user_input = [HumanMessage(content=user_input)]
        async for event in jockey.astream_events({"chat_history": user_input}, {"configurable": {"thread_id": 2}}, version="v1"):
            parse_langserve_events(event)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Missing argument: 'server' or 'local' as argument when launching.")
    elif sys.argv[1] == "local":
        asyncio.run(run_jockey())