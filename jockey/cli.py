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
from jockey.jockey_graph import JockeyState
from typing import List
from langchain_core.runnables.schema import StreamEvent
from jockey.jockey_graph import FeedbackEntry


# async def process_single_message(message: str):
#     """Process a single message and exit."""
#     console = Console()

#     console.print()
#     console.print(f"[green]👤 Chat: {message}")
#     user_input = [HumanMessage(content=message, name="user")]
#     jockey_input = {"chat_history": user_input, "made_plan": False, "next_worker": None, "active_plan": None}

#     try:
#         last_event = None
#         stream = jockey.astream_events(jockey_input, {"configurable": {"thread_id": session_id}}, version="v2")

#         async for event in stream:
#             last_event = event
#             await parse_langchain_events_terminal(event)

#     except JockeyError as e:
#         console.print(f"\n🚨🚨🚨[red]Jockey Error: {str(e)}[/red]")
#         jockey_error_event = create_jockey_error_event(session_id, last_event, e)
#         await parse_langchain_events_terminal(jockey_error_event)
#         raise

#     console.print()


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    console = Console()
    session_id = uuid.uuid4()
    thread = {"configurable": {"thread_id": session_id}}

    try:
        while True:  # Outer loop for new chat messages
            # Get initial user input
            console.print()
            user_input = console.input("[green]👤 Chat: ")
            if not user_input.strip():
                return

            # Prepare input for processing
            messages = [HumanMessage(content=user_input, name="user")]
            jockey_input = {"chat_history": messages, "made_plan": False, "next_worker": None, "active_plan": None}

            # Process until we need human input
            events: List[StreamEvent] = []
            try:
                # Stream until we hit the ask_human breakpoint
                async for event in jockey.astream_events(jockey_input, thread, version="v2"):
                    # event["chat_history"][-1].pretty_print()
                    events.append(event)
                    await parse_langchain_events_terminal(event)

                # go here when we are interrupted by the ask_human node
                while True:
                    state = jockey.get_state(thread)

                    # If we've reached a terminal state or reflection, break to get new chat input
                    if not state.next or state.values["next_worker"].lower() == "reflect":
                        break

                    latest_chat_history = state.values["chat_history"][-1]

                    # Get user feedback
                    try:
                        feedback_user_input = console.input("\n[green]👤 Feedback: ")
                    except KeyboardInterrupt:
                        feedback_user_input = "no feedback"
                        console.print("\nExiting Jockey terminal...")
                        # process in events log
                        interrupt_event = create_interrupt_event(session_id, events[-1])
                        await parse_langchain_events_terminal(interrupt_event)
                        sys.exit(0)

                    # get the current feedback_history and append the new feedback
                    current_feedback_history: List[FeedbackEntry] = jockey.get_state(thread).values["feedback_history"]
                    feedback_entry: FeedbackEntry = {
                        "node_content": latest_chat_history.content,
                        "node": latest_chat_history.name,
                        "feedback": feedback_user_input,
                    }

                    if current_feedback_history[-1].get("feedback") is None:
                        # if feedback is None, update the last entry
                        current_feedback_history[-1]["feedback"] = feedback_user_input
                    else:
                        # otherwise, append the new entry
                        current_feedback_history.append(feedback_entry)

                    # send the updated feedback_history to the ask_human node
                    await jockey.aupdate_state(thread, {"feedback_history": current_feedback_history}, as_node="ask_human")


                    # # check that the update actually worked
                    # new_state = jockey.get_state(thread)
                    # check = new_state.values["feedback_history"]

                    # Process the next steps until we need human input again
                    async for event in jockey.astream_events(None, thread, version="v2"):
                        events.append(event)
                        await parse_langchain_events_terminal(event)

                # print the current state
                print("\nstate::run_jockey_terminal::current_state", jockey.get_state(thread))

            except asyncio.CancelledError:
                console.print("\nOperation interrupted")
                interrupt_event = create_interrupt_event(session_id, events[-1])
                await parse_langchain_events_terminal(interrupt_event)
                return

            except get_langgraph_errors() as e:
                console.print(f"\n🚨🚨🚨[red]LangGraph Error: {str(e)}[/red]")
                print("error", e)
                langgraph_error_event = create_langgraph_error_event(session_id, events[-1], e)
                await parse_langchain_events_terminal(langgraph_error_event)
                return

            except JockeyError as e:
                console.print(f"\n🚨🚨🚨[red]Jockey Error: {str(e)}[/red]")
                jockey_error_event = create_jockey_error_event(session_id, events[-1], e)
                await parse_langchain_events_terminal(jockey_error_event)
            # return

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
