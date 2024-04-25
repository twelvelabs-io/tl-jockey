import asyncio
import sys
import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from rich import print
from rich.console import Console
from jockey_tools import JOCKEY_TOOLKIT
from util import TokenByTokenHandler
from fastapi import FastAPI
from langchain.pydantic_v1 import BaseModel, Field
from typing import Any
from langserve import add_routes


load_dotenv()

def build_jockey():
    if len(sys.argv) < 3:
        prompt_filepath = os.path.join(os.path.curdir, "prompts", "video_truncation.txt")
    elif os.path.isfile(os.path.join(os.path.curdir, "prompts", sys.argv[2])):
        prompt_filepath = os.path.join(os.path.curdir, "prompts", sys.argv[2])

    with open(prompt_filepath, "r") as prompt_file:
        system_prompt = prompt_file.read()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                system_prompt
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    llm = AzureChatOpenAI(
        deployment_name="gpt-4",
        streaming=True,
        temperature=0.01,
        model_version="1106-preview"
    )

    jockey_agent = create_openai_tools_agent(llm, JOCKEY_TOOLKIT, prompt)
    jockey_executor = AgentExecutor(agent=jockey_agent, tools=JOCKEY_TOOLKIT, verbose=True, return_intermediate_steps=True)

    chat_history = ChatMessageHistory()

    jockey = RunnableWithMessageHistory(
        jockey_executor,
        lambda session_id: chat_history,
        input_messages_key="input",
        output_messages_key="output",
        history_messages_key="chat_history",
    )

    return jockey

async def run_jockey():
    jockey = build_jockey()

    tool_descriptions = {
        tool.name: tool.description.split("-")[-1] for tool in JOCKEY_TOOLKIT
    }

    console = Console()

    handler = TokenByTokenHandler()

    while True:
        user_input = console.input("[green]Chat: ")

        console.print(f"[cyan]Jockey: ", end="")

        await jockey.ainvoke({"input": user_input, "tool_descriptions": tool_descriptions},
                             {"configurable": {"session_id": "1"}, "callbacks": [handler]})
                
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Missing argument: 'server' or 'local' as argument when launching.")
    elif sys.argv[1] == "local":
        asyncio.run(run_jockey())
    elif sys.argv[1] == "server":
        app = FastAPI(
        title="Jockey Server",
        version="0.1",
        description="Server for interacting with Jockey via API.",
        )

        tool_descriptions = {
            tool.name: tool.description.split("-")[-1] for tool in JOCKEY_TOOLKIT
        }

        class InputChat(BaseModel):
            """Input for the chat endpoint."""
            input: str = Field(
                description="The human input to the chat system.",
                extra={"widget": {"type": "chat", "input": "input", "output": "output"}},
            )
            tool_descriptions = tool_descriptions

        class Output(BaseModel):
            output: Any

        jockey = build_jockey().with_types(input_type=InputChat, output_type=Output)

        add_routes(
            app,
            jockey,
            path="/jockey",
        )

        import uvicorn

        uvicorn.run(app, host="localhost", port=8000)
    else:
        print("Use one of: 'server', 'local' as argument when launching.")