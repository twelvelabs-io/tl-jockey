import asyncio
import sys
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from rich import print
from rich.console import Console
from jockey_tools import ( 
    video_search,
    download_video, 
    combine_clips, 
    remove_segment
)
from util import TokenByTokenHandler
from fastapi import FastAPI
from langchain.pydantic_v1 import BaseModel, Field
from typing import Any
from langserve import add_routes


load_dotenv()

def build_jockey():
    tools = [video_search, download_video, combine_clips, remove_segment]
    
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are Jockey, a conversational video agent developed by Twelve Labs. 
                Your objective is to assist the user with all their needs including those related to video.
                You will not directly interact with video content yourself but can parse user input so that it can be 
                passed to video-language foundation models created by Twelve Labs or auxillary video functions.
                For non-video related requests, assist the user to the best of your ability.

                In order to use certain tools that you have access to, you will need an Index ID.
                If the user has not explicitly specified an Index ID and you need to use a tool that requires one, ask them to specify an Index ID.
                When a user specifies an Index ID use that Index ID for tools that require it until a user specifies a new Index ID.

                You have access to the following tools:
               
                {tool_descriptions}

                Your responses will be parsed and presented in a UI to the user so you must always adhere to the following to ensure your responses can be properly returned to the user.
                
                Your final response should ALWAYS be a text

                If you used any tools the `final_response` field should just be a general recap of the actions you took.
                DO NOT include any data from the `tools` field in the `final_response` field.  Don't send JSON object at all only `final_response` as a text

                Otherwise, `final_response` field should just be your general response to the user.
                If a tool was not used you can omit the `tools` field.
                """
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

    jockey_agent = create_openai_tools_agent(llm, tools, prompt)
    jockey_executor = AgentExecutor(agent=jockey_agent, tools=tools, verbose=False, return_intermediate_steps=False)

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

    tools = [video_search, download_video, combine_clips, remove_segment]

    tool_descriptions = {
        tool.name: tool.description.split("-")[-1] for tool in tools
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

        tools = [video_search, download_video, combine_clips, remove_segment]

        tool_descriptions = {
            tool.name: tool.description.split("-")[-1] for tool in tools
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