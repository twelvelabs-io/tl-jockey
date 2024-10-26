import uuid
import os
import subprocess
from rich.console import Console
from jockey.util import parse_langchain_events_terminal, get_langgraph_errors
from langchain_core.messages import HumanMessage
from jockey.app import jockey
from jockey.stirrups.errors import JockeyError
import asyncio
from jockey.util import create_interrupt_event, create_langgraph_error_event, create_jockey_error_event


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    console = Console()
    session_id = uuid.uuid4()

    while True:
        try:
            console.print()
            user_input = console.input("[green]👤 Chat: ")
            if not user_input.strip():
                continue

            user_input = [HumanMessage(content=user_input, name="user")]
            jockey_input = {"chat_history": user_input, "made_plan": False, "next_worker": None, "active_plan": None}

            try:
                last_event = None
                stream = jockey.astream_events(jockey_input, {"configurable": {"thread_id": session_id}}, version="v2")

                async for event in stream:
                    last_event = event
                    await parse_langchain_events_terminal(event)

            except asyncio.CancelledError:
                # Create and emit the interrupt event
                if last_event:
                    interrupt_event = create_interrupt_event(session_id, last_event)
                    await parse_langchain_events_terminal(interrupt_event)
                console.print("\nOperation interrupted")
                continue

            except get_langgraph_errors() as e:
                error_message = f"LangGraph Error occurred: {str(e)}"
                console.print(f"[red]{error_message}[/red]")
                if last_event:
                    langgraph_error_event = create_langgraph_error_event(session_id, last_event, error_message)
                    await parse_langchain_events_terminal(langgraph_error_event, e)
                console.print(f"[red]{error_message}[/red]")
                continue

            except JockeyError as e:
                error_message = f"Jockey Error occurred: {str(e)}"
                console.print(f"[red]{error_message}[/red]")
                if last_event:
                    jockey_error_event = create_jockey_error_event(session_id, last_event, error_message)
                    await parse_langchain_events_terminal(jockey_error_event, e)
                continue

            console.print()

        except KeyboardInterrupt:
            console.print("\nExiting Jockey terminal...")
            return


def run_jockey_server():
    """Quickstart function to create run Jockey in a LangGraph API container for easy dev work.
    We use the default version of Jockey for this."""
    jockey_package_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    langgraph_json_file_path = os.path.join(jockey_package_dir, "langgraph.json")
    compose_file_path = os.path.join(jockey_package_dir, "compose.yaml")

    langgraph_cli_command = ["langgraph", "up", "-c", langgraph_json_file_path, "-d", compose_file_path, "--recreate", "--verbose"]

    print(f"Using langgraph-cli command:\n\t {str.join(' ', langgraph_cli_command)}")

    with subprocess.Popen(langgraph_cli_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as process:
        for line in process.stdout:
            print(line.decode("utf-8", errors="replace"), end="")

        process.wait()
        if process.returncode != 0:
            print(f"Command exited with non-zero status {process.returncode}.")
