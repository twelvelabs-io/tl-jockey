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
from typing import List
from langchain_core.runnables.schema import StreamEvent
from jockey.jockey_graph import FeedbackEntry
from jockey.thread import session_id, thread
# from jockey.video_utils import download_m3u8_videos


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    console = Console()

    try:
        while True:  # Outer loop for new chat messages
            # Get initial user input
            console.print()
            user_input = console.input("[green]👤 Chat: ")
            if not user_input.strip():
                return

            # Prepare input for processing
            messages = [HumanMessage(content=user_input, name="user")]
            jockey_input = {
                "chat_history": messages,
                "made_plan": False,
                "next_worker": None,
                "active_plan": None,
                "tool_call": None,
                "feedback_history": [],
            }

            # Process until we need human input
            events: List[StreamEvent] = []
            try:
                # Stream until we hit the ask_human breakpoint
                async for event in jockey.astream_events(input=jockey_input, config=thread, version="v2"):
                    # event["chat_history"][-1].pretty_print()
                    events.append(event)
                    # if event["event"] == "on_tool_end":
                    # download_m3u8_videos(event)
                    await parse_langchain_events_terminal(event)

            except asyncio.CancelledError:
                console.print("\nOperation interrupted")
                interrupt_event = create_interrupt_event(session_id, events[-1])
                await parse_langchain_events_terminal(interrupt_event)
                # go here when we are interrupted by the ask_human node
                # while True:
                # if jockey.get_state(thread).values["next_worker"] == "reflect":
                # break

                # Get user feedback
                # try:
                #     feedback_user_input = console.input("\n[green]👤 Feedback: ")
                # except KeyboardInterrupt:
                #     console.print("\nExiting Jockey terminal...")
                #     interrupt_event = create_interrupt_event(session_id, events[-1])
                #     await parse_langchain_events_terminal(interrupt_event)
                #     sys.exit(0)

                # 1. get the feedback history
                # current_feedback_history: List[FeedbackEntry] = jockey.get_state(thread).values["feedback_history"]
                # 2. update the feedback_history with the new feedback
                # current_feedback_history[-1]["feedback"] = feedback_user_input
                # 3. update the state with the new feedback history
                # await jockey.aupdate_state(thread, {"feedback_history": current_feedback_history})

                # 4. check that the update actually worked
                # new_state = jockey.get_state(thread)
                # check = new_state.values["feedback_history"]

                # Process the next steps until we need human input again
                # async for event in jockey.astream_events(input=None, config=thread, version="v2"):
                #     # if event["event"] == "on_tool_end":
                #     # let's handle the m3u8 video
                #     # download_m3u8_videos(event)
                #     await parse_langchain_events_terminal(event)

            # except get_langgraph_errors() as e:
            #     console.print(f"\n🚨🚨🚨[red]LangGraph Error: {str(e)}[/red]")
            #     print("error", e)
            #     langgraph_error_event = create_langgraph_error_event(session_id, events[-1], e)
            #     await parse_langchain_events_terminal(langgraph_error_event)
            #     return

            # except JockeyError as e:
            #     console.print(f"\n🚨🚨🚨[red]Jockey Error: {str(e)}[/red]")
            #     jockey_error_event = create_jockey_error_event(session_id, events[-1], e)
            #     await parse_langchain_events_terminal(jockey_error_event)
            #     return

    except KeyboardInterrupt:
        console.print("\nExiting Jockey terminal...")
        sys.exit(0)


def run_jockey_server():
    """Quickstart function to create run Jockey in a LangGraph API container for easy dev work.
    We use the default version of Jockey for this.

    https://langchain-ai.github.io/langgraph/cloud/reference/cli/
    """
    jockey_package_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    langgraph_json_file_path = os.path.join(jockey_package_dir, "langgraph.json")
    compose_file_path = os.path.join(jockey_package_dir, "compose.yaml")

    # Add debugging options
    langgraph_cli_command = [
        "langgraph",
        "up",
        "-c",
        langgraph_json_file_path,
        "-d",
        compose_file_path,
        "--recreate",
        "--verbose",
    ]

    print(f"Using langgraph-cli command:\n\t {str.join(' ', langgraph_cli_command)}")

    with subprocess.Popen(langgraph_cli_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as process:
        for line in process.stdout:
            print(line.decode("utf-8", errors="replace"), end="")

        process.wait()
        if process.returncode != 0:
            print(f"Command exited with non-zero status {process.returncode}.")
