import uuid
import os
import subprocess
import shutil
import platform
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

def run_jockey_server():
    """Quickstart function to create run Jockey in a LangGraph API container for easy dev work.
    We use the default version of Jockey for this."""
    os_name = platform.system()

    jockey_package_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    langgraph_json_file_path = os.path.join(jockey_package_dir, "langgraph.json")
    compose_file_path = os.path.join(jockey_package_dir, "compose.yaml")
    langgraph_data_dir = os.path.join(jockey_package_dir, ".langgraph-data")

    # Find the langgraph executable dynamically
    langgraph_path = shutil.which("langgraph")
    if not langgraph_path:
        print("Error: langgraph is not installed or not found in PATH.")
        return

    # Check if the directory is writable
    if not os.access(langgraph_data_dir, os.W_OK):
        print(f"Warning: You do not have write access to the {langgraph_data_dir} directory.")
        if os_name == "Linux":
            print("Attempting to use sudo on Linux (Ubuntu).")
            langgraph_cli_command = [
                "sudo", langgraph_path,  # Use sudo for elevated permissions on Linux
                "up",
                "-c", langgraph_json_file_path,
                "-d", compose_file_path,
                "--recreate",
                "--verbose"
            ]
        else:
            print("Please check permissions or run the command with elevated privileges.")
            return
    else:
        # No sudo required if write access is present
        langgraph_cli_command = [
            langgraph_path,
            "up",
            "-c", langgraph_json_file_path,
            "-d", compose_file_path,
            "--recreate",
            "--verbose"
        ]

    print(f"Using langgraph-cli command:\n\t {str.join(' ', langgraph_cli_command)}")

    with subprocess.Popen(langgraph_cli_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) as process:
        for line in process.stdout:
            print(line, end='')

        process.wait()
        if process.returncode != 0:
            print(f"Command exited with non-zero status {process.returncode}.")
