import asyncio
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


load_dotenv()

async def run_jockey():
    tools = [video_search, download_video, combine_clips, remove_segment]

    tool_descriptions = {
        tool.name: tool.description.split("-")[-1] for tool in tools
    }
    
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
                
                Your final response should ALWAYS be a JSON object including the following fields:
                    tools: [dict(tool_name, tool_input, tool_output)],
                    final_response: string

                If you used any tools the `final_response` field should just be a general recap of the actions you took.
                DO NOT include any data from the `tools` field in the `final_response` field.

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
        deployment_name="gpt-4-32k",
        streaming=True,
        temperature=0.01,
        model_version="0613"
    )

    jockey_agent = create_openai_tools_agent(llm, tools, prompt)
    jockey_executor = AgentExecutor(agent=jockey_agent, tools=tools, verbose=True, return_intermediate_steps=True)
    

    chat_history = ChatMessageHistory()

    jockey = RunnableWithMessageHistory(
        jockey_executor,
        lambda session_id: chat_history,
        input_messages_key="input",
        output_messages_key="output",
        history_messages_key="chat_history"
    )

    console = Console()

    handler = TokenByTokenHandler()

    while True:
        user_input = console.input("[green]Chat: ")

        console.print(f"[cyan]Jockey: ", end="")

        response = await jockey.ainvoke({"input": user_input, "tool_descriptions": tool_descriptions},
                            {"configurable": {"session_id": "1"}, "callbacks": [handler]})
                
if __name__ == "__main__":
    asyncio.run(run_jockey())
