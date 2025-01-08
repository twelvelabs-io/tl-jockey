import os
import requests
import ffmpeg
import urllib.parse
import tqdm
import json
import subprocess
from jockey.thread import session_id
from typing import Dict
import hashlib

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urllib.parse.urljoin(TL_BASE_URL, "indexes/")


def get_filename(result: Dict) -> str:
    """
    Creates a standardized filename from a video title and a hashed timestamp range.

    Args:
        result: The result from the video search.

    Returns:
        The filename of the video clip.
        format: clip-<video_id>_<start_end_hash>.mp4
    """
    video_id = result["video_id"]
    start_time = result["start"]
    end_time = result["end"]

    # Generate the MD5 hash of the start and end times
    start_end_md5 = hashlib.md5(f"{start_time}_{end_time}".encode()).hexdigest()[-8:]

    # Create the filename using the video ID and the hash
    return f"clip-{video_id}_{start_end_md5}.mp4"


def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"

    headers = {"accept": "application/json", "Content-Type": "application/json", "x-api-key": os.environ["TWELVE_LABS_API_KEY"]}

    response = requests.get(video_url, headers=headers)

    try:
        assert response.status_code == 200
    except AssertionError:
        error_response = {
            "message": f"There was an error getting the metadata for Video ID: {video_id} in Index ID: {index_id}. "
            "Double check that the Video ID and Index ID are valid and correct.",
            "error": response.text,
        }
        return error_response

    return response


def download_video(video_id: str, index_id: str, start: float, end: float) -> str:
    """
    Download a video for a given video in a given index and its start and end times.

    Args:
        video_id: The ID of the video to download.
        index_id: The ID of the index to download the video from.
        start: The start time of the video to download.
        end: The end time of the video to download.

    Returns:
        The filepath of the downloaded video.
    """
    headers = {"x-api-key": os.environ["TWELVE_LABS_API_KEY"], "accept": "application/json", "Content-Type": "application/json"}

    video_url = f"https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id}"

    response = requests.get(video_url, headers=headers)

    assert response.status_code == 200

    hls_uri = response.json()["hls"]["video_url"]

    video_dir = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id)

    if not os.path.exists(video_dir):
        os.makedirs(video_dir, exist_ok=True)

    video_filename = get_filename({"video_id": video_id, "start": start, "end": end})
    video_path = os.path.join(video_dir, video_filename)

    if os.path.isfile(video_path) is False:
        try:
            duration = end - start
            buffer = 1  # Add a 1-second buffer on each side
            ffmpeg.input(filename=hls_uri, strict="experimental", loglevel="quiet", ss=max(0, start - buffer), t=duration + 2 * buffer).output(
                video_path, vcodec="libx264", acodec="aac", avoid_negative_ts="make_zero", fflags="+genpts"
            ).run()

            # Then trim the video more precisely
            output_trimmed = f"{os.path.splitext(video_path)[0]}_trimmed.mp4"
            ffmpeg.input(video_path, ss=buffer, t=duration).output(output_trimmed, vcodec="copy", acodec="copy").run()

            # Replace the original file with the trimmed version
            os.replace(output_trimmed, video_path)
        except Exception as error:
            error_response = {
                "message": f"There was an error downloading the video with Video ID: {video_id} in Index ID: {index_id}. "
                "Double check that the Video ID and Index ID are valid and correct.",
                "error": str(error),
            }
            return error_response

    return video_path


# def download_m3u8_videos(event):
#     """Download and trim M3U8 videos into mp4 files with caching and progress display.

#     mp4 files are sorted by start time, then trimmed by end time. they are put into filepath output/{session_id}
#     """
#     # Create session directory if it doesn't exist
#     trimmed_filepath = "output/" + str(session_id)
#     source_filepath = "output/source"
#     os.makedirs(trimmed_filepath, exist_ok=True)
#     os.makedirs(source_filepath, exist_ok=True)
#     downloaded_videos = set()  # Cache of downloaded video URLs for this function call

#     for item in tqdm(json.loads(event["data"]["output"]), desc="Processing Videos"):
#         video_url = item.get("video_url")
#         video_id = item.get("video_id")

#         if (os.path.exists(os.path.join(source_filepath, f"{video_id}.mp4"))) or (video_id and video_id not in downloaded_videos):
#             start, end = item.get("start", 0), item.get("end")
#             source_file = os.path.join(source_filepath, f"{video_id}.mp4")

#             # Download video showing yt-dlp progress
#             subprocess.run(["yt-dlp", "-o", source_file, video_url, "--progress", "--quiet"])
#             downloaded_videos.add(video_id)

#         # Trim the video if end time is provided
#         if item.get("end") is not None:
#             start, end = item.get("start", 0), item.get("end")
#             output_file = os.path.join(source_filepath, f"{video_id}.mp4")
#             trimmed_file = os.path.join(trimmed_filepath, f"trimmed-{start}-{end}.mp4")
#             duration = end - start

#             # Run ffmpeg silently
#             subprocess.run([
#                 "ffmpeg",
#                 "-hide_banner",
#                 "-loglevel",
#                 "error",  # Only show errors
#                 "-ss",
#                 str(start),
#                 "-i",
#                 output_file,
#                 "-t",
#                 str(duration),
#                 "-c",
#                 "copy",
#                 trimmed_file,
#             ])
