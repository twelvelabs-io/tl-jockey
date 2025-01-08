import os
import subprocess
from rich.console import Console
from jockey.util import parse_langchain_events_terminal
from jockey.stirrups.errors import create_interrupt_event
from langchain_core.messages import HumanMessage
from jockey.app import jockey
import asyncio
import sys
from typing import List
from langchain_core.runnables.schema import StreamEvent
from jockey.thread import session_id, thread


async def run_jockey_terminal():
    """Quickstart function to create a Jockey instance in the terminal for easy dev work."""
    console = Console()

    try:
        # Outer loop for new chat messages
        while True:
            # Get initial user input
            console.print()
            user_input = console.input("[green]👤 Chat: ")
            if not user_input.strip():
                user_input = "find 2 dunking videos in the index 670514a1e5620307b898b0c5"
                print(user_input)
                # return

            # Prepare input for processing
            jockey_input = {
                "chat_history": [HumanMessage(content=user_input, name="user")],
                "made_plan": False,
                "next_worker": None,
                "active_plan": None,
                "tool_call": None,
                "clips_from_search": {},
                "relevant_clip_keys": [],
                "index_id": None,
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
    langgraph_data_dir = os.path.join(jockey_package_dir, ".langgraph-data")

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
