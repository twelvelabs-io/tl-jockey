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


def parse_langchain_events_terminal(event: dict):
    """Used to parse events emitted from Jockey when called as an API."""
    console = Console()

    if event["event"] == "on_chat_model_stream":
        if isinstance(event["data"]["chunk"], dict):
            content = event["data"]["chunk"]["content"]
        else:
            content = event["data"]["chunk"].content 
        
        if content and "instructor" in event["tags"]:
            console.print(f"[red]{content}", end="")
        elif content and "planner" in event["tags"]:
            console.print(f"[yellow]{content}", end="")
        elif content and "supervisor" in event["tags"]:
            console.print(f"[white]{content}", end="")
    elif event["event"] == "on_tool_start":
        tool = event["name"]
        console.print(Padding(f"[cyan]🏇 Using: {tool}", (1, 0, 0, 2)))
        console.print(Padding(f"[cyan]🏇 Inputs:", (0, 2)))
        console.print(Padding(JSON(json.dumps(event["data"]["input"]), indent=2), (1, 6)))
    elif event["event"] == "on_tool_end":
        tool = event["name"]
        console.print(Padding(f"[cyan]🏇 Finished Using: {tool}", (0, 2)))
        console.print(Padding(f"[cyan]🏇 Outputs:", (0, 2)))
        try:
            console.print(Padding(JSON(event["data"]["output"], indent=2), (1, 6)))
        except (json.decoder.JSONDecodeError, TypeError):
            console.print(Padding(str(event["data"]["output"]), (0, 6)))
    elif event["event"] == "on_chat_model_start":
        if "instructor" in event["tags"]:
            console.print(Padding(f"[red]🏇 Instructor: ", (1, 0)), end="")
        elif "planner" in event["tags"]:
            console.print(Padding(f"[yellow]🏇 Planner: ", (1, 0)), end="")
        elif "reflect" in event["tags"]:
            console.print()
            console.print(f"[cyan]🏇 Jockey: ", end="")


def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"]
    }

    response = requests.get(video_url, headers=headers)

    try:
        assert response.status_code == 200
    except AssertionError:
        error_response = {
                "message": f"There was an error getting the metadata for Video ID: {video_id} in Index ID: {index_id}. "
                "Double check that the Video ID and Index ID are valid and correct.",
                "error": response.text
            }
        return error_response

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
        
    assert response.status_code == 200

    hls_uri = response.json()["hls"]["video_url"]

    video_dir = os.path.join(os.getcwd(), "public", index_id)

    if os.path.isdir(video_dir) is False:
        os.mkdir(video_dir)

    video_filename = f"{video_id}_{start}_{end}.mp4"
    video_path = os.path.join(video_dir, video_filename)

    if os.path.isfile(video_path) is False:
        try:
            duration = end - start
            ffmpeg.input(filename=hls_uri, strict="experimental", loglevel="quiet", ss=start, t=duration).output(video_path, vcodec="copy", acodec="copy").run()
        except Exception as error:
            error_response = {
                "message": f"There was an error downloading the video with Video ID: {video_id} in Index ID: {index_id}. "
                "Double check that the Video ID and Index ID are valid and correct.",
                "error": str(error)
            }
            return error_response

    return video_path
