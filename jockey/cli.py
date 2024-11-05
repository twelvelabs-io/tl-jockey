import uuid
import os
import subprocess
from rich.console import Console
from jockey.util import parse_langchain_events_terminal
from jockey.stirrups.errors import create_interrupt_event, create_langgraph_error_event, create_jockey_error_event, get_langgraph_errors
from langchain_core.messages import HumanMessage
from jockey.app import jockey
from jockey.stirrups.errors import JockeyError
import asyncio
import sys
from jockey.jockey_graph import JockeyState, Jockey


async def process_single_message(message: str):
    """Process a single message and exit."""
    console = Console()
    session_id = uuid.uuid4()

    console.print()
    console.print(f"[green]👤 Chat: {message}")
    user_input = [HumanMessage(content=message, name="user")]
    jockey_input = {"chat_history": user_input, "made_plan": False, "next_worker": None, "active_plan": None}

    try:
        last_event = None
        stream = jockey.astream_events(jockey_input, {"configurable": {"thread_id": session_id}}, version="v2")

        async for event in stream:
            last_event = event
            await parse_langchain_events_terminal(event)

    except JockeyError as e:
        console.print(f"\n🚨🚨🚨[red]Jockey Error: {str(e)}[/red]")
        jockey_error_event = create_jockey_error_event(session_id, last_event, e)
        await parse_langchain_events_terminal(jockey_error_event)
        raise

    console.print()


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    console = Console()
    session_id = uuid.uuid4()
    thread = {"configurable": {"thread_id": session_id}}

    try:
        console.print()
        user_input = console.input("[green]👤 Chat: ")
        if not user_input.strip():
            return

        user_input = [HumanMessage(content=user_input, name="user")]
        jockey_input = {"chat_history": user_input, "made_plan": False, "next_worker": None, "active_plan": None}

        try:
            last_event = None
            stream = jockey.astream_events(jockey_input, thread, version="v2")

            async for event in stream:
                last_event = event
                await parse_langchain_events_terminal(event)

            # human feedback section
            # get user input
            try:
                user_input = console.input("[green]👤 Feedback: ")
            except KeyboardInterrupt:
                user_input = "no feedback"
                console.print("\nExiting Jockey terminal...")
                sys.exit(0)

            # update jockey state with feedback
            jockey_state_human_feedback = JockeyState(
                chat_history=last_event.get("chat_history", []),
                next_worker=last_event.get("next_worker", None),
                made_plan=last_event.get("made_plan", False),
                active_plan=last_event.get("active_plan", None),
                feedback=user_input,
            )

            jockey_graph.update_state(thread, jockey_state_human_feedback, as_node="human_feedback")

            # debug
            print("--State after update--")
            print(jockey_graph.get_state(thread))
            jockey_graph.get_state(thread).next

            # proceed
            for event in jockey_graph.stream(None, thread, stream_mode="values"):
                print(event)

        except asyncio.CancelledError:
            console.print("\nOperation interrupted")
            if last_event:
                interrupt_event = create_interrupt_event(session_id, last_event)
                await parse_langchain_events_terminal(interrupt_event)
            return

        except get_langgraph_errors() as e:
            console.print(f"\n🚨🚨🚨[red]LangGraph Error: {str(e)}[/red]")
            if last_event:
                langgraph_error_event = create_langgraph_error_event(session_id, last_event, e)
                await parse_langchain_events_terminal(langgraph_error_event)
            return

        except JockeyError as e:
            console.print(f"\n🚨🚨🚨[red]Jockey Error: {str(e)}[/red]")
            if last_event:
                jockey_error_event = create_jockey_error_event(session_id, last_event, e)
                await parse_langchain_events_terminal(jockey_error_event)
            return

        console.print()

    except KeyboardInterrupt:
        console.print("\nExiting Jockey terminal...")
        sys.exit(0)


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
