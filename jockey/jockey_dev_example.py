import uuid
import asyncio
from dotenv import load_dotenv
from rich.console import Console
from jockey.util import parse_langchain_events_terminal
from langchain_core.messages import HumanMessage
from jockey.jockey_default_server import build_jockey, planner_llm, supervisor_llm, worker_llm


load_dotenv()

async def run_jockey():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    # NOTE: The LLMs here are imported from the default server. You should change them there so that
    # it propagates when using the LangGraph API server.
    jockey = build_jockey(planner_llm=planner_llm, supervisor_llm=supervisor_llm, worker_llm=worker_llm)

    console = Console()

    session_id = uuid.uuid4()

    while True:
        console.print()
        user_input = console.input("[green]👤 Chat: ")

        # Collect user input as a HumanMessage
        # Reset the state of Jockey instance every new user invocation.
        user_input = [HumanMessage(content=user_input, name="user")]
        jockey_input = {
            "chat_history": user_input,
            "made_plan": False,
            "next_worker": None,
            "active_plan": None
        }
        async for event in jockey.astream_events(jockey_input, {"configurable": {"thread_id": session_id}}, version="v1"):
            parse_langchain_events_terminal(event)

        console.print()


if __name__ == "__main__":
    asyncio.run(run_jockey())