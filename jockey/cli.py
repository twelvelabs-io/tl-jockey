import uuid
import os
import subprocess
from rich.console import Console
from jockey.util import parse_langchain_events_terminal
from langchain_core.messages import HumanMessage
from jockey.app import jockey


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work.
    We use the default version of Jockey for this."""
    console = Console()

    session_id = uuid.uuid4()

    while True:

        try:
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
            async for event in jockey.astream_events(jockey_input, {"configurable": {"thread_id": session_id}}, version="v2"):
                parse_langchain_events_terminal(event)

            console.print()

        except (EOFError):
            console.print("[red]Press Ctrl + C again to exit...[/red]")



def run_jockey_server():
    """Quickstart function to create run Jockey in a LangGraph API container for easy dev work.
    We use the default version of Jockey for this."""
    jockey_package_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    langgraph_json_file_path = os.path.join(jockey_package_dir, "langgraph.json")
    compose_file_path = os.path.join(jockey_package_dir, "compose.yaml")

    langgraph_cli_command = [
        "langgraph", 
        "up", 
        "-c", langgraph_json_file_path, 
        "-d", compose_file_path, 
        "--recreate", 
        "--verbose"
    ]

    print(f"Using langgraph-cli command:\n\t {str.join(' ', langgraph_cli_command)}")

    with subprocess.Popen(langgraph_cli_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as process:
        for line in process.stdout:
            print(line.decode('utf-8', errors='replace'), end='')

        process.wait()
        if process.returncode != 0:
            print(f"Command exited with non-zero status {process.returncode}.")
