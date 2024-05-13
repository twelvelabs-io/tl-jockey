import os
import json
import requests
import urllib
import ffmpeg
from typing import TYPE_CHECKING, Any, Dict, List
from rich.padding import Padding
from rich.console import Console
from rich.json import JSON

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urllib.parse.urljoin(TL_BASE_URL, "indexes/")
CONSOLE = Console()


def parse_langserve_events(event: dict):
    """Used to parse events emitted from Jockey when called as an API."""
    if event["event"] == "on_chat_model_stream":
        content = event["data"]["chunk"].content
        if content and "instructions_generator" in event["tags"]:
            CONSOLE.print(f"[red]{content}", end="")
        elif content and "planner" in event["tags"]:
            CONSOLE.print(f"[yellow]{content}", end="")
        elif content and "supervisor" in event["tags"]:
            CONSOLE.print(f"[white]{content}", end="")
    elif event["event"] == "on_tool_start":
        tool = event["name"]
        CONSOLE.print(Padding(f"\n[cyan]🏇 Using: {tool}", (0, 2)))
        CONSOLE.print(Padding(f"[cyan]🏇 Inputs:", (0, 2)))
        CONSOLE.print(Padding(JSON(json.dumps(event["data"]["input"]), indent=2), (0, 6)))
    elif event["event"] == "on_tool_end":
        tool = event["name"]
        CONSOLE.print(Padding(f"[cyan]🏇 Finished Using: {tool}", (0, 2)))
        CONSOLE.print(Padding(f"[cyan]🏇 Outputs:", (0, 2)))
        CONSOLE.print(Padding(str(event["data"]["output"]), (0, 6)))
    elif event["event"] == "on_chat_model_start":
        if "instructions_generator" in event["tags"]:
            CONSOLE.print()
            CONSOLE.print(f"[red]🏇 Instructions To Worker: ", end="")
        elif "planner" in event["tags"]:
            CONSOLE.print(f"\n[yellow]🏇 Planner: ", end="")
        elif "reflect" in event["tags"]:
            CONSOLE.print(f"\n[cyan]🏇 Jockey: ", end="")


def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"]
    }

    response = requests.get(video_url, headers=headers)

    return response


def download_video(video_id: str, index_id: str, start: float, end: float) -> str:
    """Download a video for a given video in a given index and get the filepath. 
    Should only be used when the user explicitly requests video editing functionalities."""
    headers = {
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    video_url = f"https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id}"

    response = requests.get(video_url, headers=headers)

    hls_uri = response.json()["hls"]["video_url"]

    video_dir = os.path.join(os.getcwd(), index_id)

    if os.path.isdir(video_dir) is False:
        os.mkdir(video_dir)

    video_filename = f"{video_id}_{start}_{end}.mp4"
    video_path = os.path.join(video_dir, video_filename)

    if os.path.isfile(video_path) is False:
        try:
            duration = end - start
            ffmpeg.input(filename=hls_uri, strict="experimental", loglevel="quiet", ss=start, t=duration).output(video_path, vcodec="copy", acodec="libmp3lame").run()
        except Exception as error:
            error_response = {
                "message": "There was a video editing error.",
                "error": error
            }
            return error_response

    return video_path
