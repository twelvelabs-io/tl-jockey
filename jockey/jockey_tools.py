import os
import requests
import ffmpeg
import asyncio
from urllib.parse import urljoin
from langchain.tools import tool
from langchain.pydantic_v1 import BaseModel, Field
from typing import List, Dict, Union
from dotenv import load_dotenv
from interfaces import VideoSearchResult
import time

load_dotenv()


TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urljoin(TL_BASE_URL, "indexes/")
EXTERNAL_UPLOAD_URL = urljoin(
    TL_BASE_URL, "tasks/external-provider/")
SEARCH_URL = urljoin(TL_BASE_URL, "search/")
GENERATE_URL = urljoin(TL_BASE_URL, "generate/")

INDEX_ID = "65ff6c55da6cb29b7857a03c"


async def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"]
    }

    response = requests.get(video_url, headers=headers)
    if response.status_code != 200:
        return None

    return response.json()


class MarengoSearchInput(BaseModel):
    query: str = Field(
        description="Search query to run on a collection of videos.")
    index_id: str = Field(
        description="Index ID which contains a collection of videos.")
    top_n: int = Field(
        description="Used to select the top N results of a search.", gt=0, le=10)
    group_by: str = Field(
        description="Used to decide how to group search results. Must be one of: `clip` or `video`.")


@tool("video-search", args_schema=MarengoSearchInput)
async def video_search(query: str, index_id: str, top_n: int = 3, group_by: str = "clip") -> Union[List[VideoSearchResult], Dict]:
    """Run a search query against a collection of videos and get results."""
    try:
        headers = {
            "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
            "accept": "application/json",
            "Content-Type": "application/json"
        }

        # Limit top_n to 10
        top_n = min(top_n, 10)

        payload = {
            "search_options": ["visual", "conversation", "text_in_video", "logo"],
            "group_by": group_by,
            "threshold": "low",
            "sort_option": "score",
            "operator": "or",
            "conversation_option": "semantic",
            "page_limit": top_n,
            "index_id": index_id,
            "query": query
        }

        response = requests.post(SEARCH_URL, json=payload, headers=headers)

        if response.status_code != 200:
            error_response = {
                "message": "There was an API error when searching the index.",
                "url": SEARCH_URL,
                "headers": headers,
                "json_payload": payload,
                "response": response.text
            }
            return error_response

        if group_by == "video":
            top_n_results = [{"video_id": video["id"]}
                             for video in response.json()["data"][:top_n]]
        else:
            top_n_results = response.json()["data"][:top_n]

        video_ids = [result["video_id"] for result in top_n_results]

        # Get video metadata for each video ID in parallel
        video_metadata = await asyncio.gather(*[get_video_metadata(video_id=video_id, index_id=index_id) for video_id in video_ids])

        for result, metadata in zip(top_n_results, video_metadata):
            result["video_url"] = metadata["hls"]["video_url"]
            if group_by == "video":
                result["thumbnail_url"] = metadata["hls"]["thumbnail_urls"][0]

        return top_n_results

    except Exception as e:
        error_response = {
            "message": "There was an error while performing the video search.",
            "error": str(e)
        }
        return error_response


class DownloadVideoInput(BaseModel):
    video_ids: List[str] = Field(
        description="Video IDs used to download a video. It is also used as the filename for the video.")
    index_id: str = Field(
        description="Index ID which contains a collection of videos.")


@tool("download-videos", args_schema=DownloadVideoInput)
async def download_videos(video_ids: List[str], index_id: str) -> List[Union[str, dict]]:
    video_dir = os.path.join(os.getcwd(), index_id)
    video_ids = list(set(video_ids))

    os.makedirs(video_dir, exist_ok=True)

    async def download_single_video(video_id: str, index_id: str) -> Union[str, dict]:
        video_metadata = await get_video_metadata(index_id=index_id, video_id=video_id)
        if not video_metadata:
            return {"error": f"Metadata not found for video {video_id}"}

        hls_uri = video_metadata.get("hls", {}).get("video_url")
        video_path = os.path.join(video_dir, f"{video_id}.mp4")

        # Skip download if file already exists
        if os.path.isfile(video_path):
            return video_path

        process = (
            ffmpeg
            .input(hls_uri)
            .output(video_path, codec="copy")
            .overwrite_output()
            .run_async(pipe_stdout=True, pipe_stderr=True)
        )

        out, err = process.communicate()
        if process.returncode == 0:
            return video_path
        else:
            return {"error": f"Failed to download video {video_id}", "details": err.decode() if err else "Unknown error"}

    # Initiate all downloads in parallel and gather results
    results = await asyncio.gather(*[download_single_video(video_id, index_id) for video_id in video_ids], return_exceptions=True)

    return results


class Clip(BaseModel):
    video_id: str = Field(description="Video ID of the clip.")
    start: float = Field(
        description="""Start time of the clip. Must be in the format of: seconds.milliseconds""")
    end: float = Field(
        description="""End time of the clip. Must be in the format of: seconds.milliseconds""")


class CombineClipsInput(BaseModel):
    clips: List = Field(
        description="""Clip results found using the video-search tool. Must contain video_id, start, and end for each clip.""")
    queries: List[str] = Field(
        description="The search queries passed to the video-search tool to find the clips. One for each clip.")
    output_filename: str = Field(
        description="The output filename of the combined clips. Must be in the form: [filename].mp4")
    index_id: str = Field(description="Index ID the clips belong to.")


@tool("combine-clips", args_schema=CombineClipsInput)
async def combine_clips(clips: List, queries: List[str], output_filename: str, index_id: str) -> str:
    """Combine or edit multiple clips together based on video IDs that are results from the video-search tool. The full filepath for the combined clips is returned."""
    try:
        # Parse the clips from the input
        clips: List[Clip] = [Clip(**clip) for clip in clips]
    except Exception as error:
        error_response = {
            "message": "There was an error while parsing the clips.",
            "error": str(error)
        }
        return error_response
    try:
        input_streams = []
        arial_font_file = os.path.join(
            os.getcwd(), "assets", "fonts", "Arial.ttf")

        for clip, query in zip(clips, queries):
            video_id = clip.video_id
            video_filepath = os.path.join(
                os.getcwd(), index_id, f"{video_id}.mp4")

            # Check if the video file exists before proceeding
            if os.path.isfile(video_filepath) is False:
                return {
                    "message": "Please download the videos first.",
                    "video_id": video_id,
                    "error": "Video file not found."
                }

            start = clip.start
            end = clip.end
            video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter(
                "trim", start=start, end=end).filter("setpts", "PTS-STARTPTS")
            audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter(
                "atrim", start=start, end=end).filter("asetpts", "PTS-STARTPTS")

            clip_with_text_stream = video_input_stream.drawtext(text=query, x="(w-text_w)/2", fontfile=arial_font_file, box=1,
                                                                boxcolor="black", fontcolor="white", fontsize=28)

            input_streams.append(clip_with_text_stream)
            input_streams.append(audio_input_stream)

        output_filepath = os.path.join(os.getcwd(), index_id, output_filename)

        ffmpeg.concat(*input_streams, v=1, a=1).output(output_filepath,
                                                       acodec="libmp3lame").overwrite_output().run()

        return output_filepath
    except Exception as error:
        error_response = {
            "message": "There was a video editing error.",
            "error": str(error)
        }
        return error_response


class RemoveSegmentInput(BaseModel):
    video_filepath: str = Field(description="Full path to target video file.")
    start: float = Field(
        description="""Start time of segment to be removed. Must be in the format of: seconds.milliseconds""")
    end: float = Field(
        description="""End time of segment to be removed. Must be in the format of: seconds.milliseconds""")


@tool("remove-segment", args_schema=RemoveSegmentInput)
async def remove_segment(video_filepath: str, start: float, end: float) -> str:
    """Remove a segment from a video at specified start and end times The full filepath for the edited video is returned."""

    # Check if the video file exists before proceeding
    if not os.path.isfile(video_filepath):
        return {
            "message": "Please provide a valid video file.",
            "error": "Video file not found."
        }

    output_filepath = f"{os.path.splitext(video_filepath)[0]}_clipped.mp4"

    left_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter(
        "trim", start=0, end=start).filter("setpts", "PTS-STARTPTS")
    left_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter(
        "atrim", start=0, end=start).filter("asetpts", "PTS-STARTPTS")
    right_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter(
        "trim", start=end).filter("setpts", "PTS-STARTPTS")
    right_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter(
        "atrim", start=end).filter("asetpts", "PTS-STARTPTS")

    streams = [left_cut_video_stream, left_cut_audio_stream,
               right_cut_video_stream, right_cut_audio_stream]

    ffmpeg.concat(*streams, v=1, a=1).output(filename=output_filepath,
                                             acodec="libmp3lame").overwrite_output().run()

    return output_filepath


if __name__ == "__main__":
    # delete the dir and files
    import shutil
    if os.path.exists(INDEX_ID):
        shutil.rmtree(INDEX_ID)

    video_search_query = {
        'query': 'find me humans', 'index_id': INDEX_ID, 'top_n': 10, 'group_by': 'clip'}
    start_time = time.time()
    video_search_response = asyncio.run(video_search(**video_search_query))
    print(
        f"Video search len {len(video_search_response)} took {round(time.time() - start_time, 2)} seconds.")

    video_ids = [result["video_id"] for result in video_search_response]
    download_videos_query = {
        'video_ids': video_ids, 'index_id': INDEX_ID}
    start_time = time.time()
    download_response = asyncio.run(download_videos(**download_videos_query))
    print(
        f"Download videos len {len(download_response)} took {round(time.time() - start_time, 2)} seconds.")

    clips = [
        {'video_id': result['video_id'],
            'start': result['start'], 'end': result['end']}
        for result in video_search_response
    ]
    combine_clips_query = {
        'clips': clips, 'queries': ['logo' for _ in download_response], 'output_filename': 'combined_clips.mp4', 'index_id': INDEX_ID}
    start_time = time.time()
    combine_clips_response = asyncio.run(combine_clips(**combine_clips_query))
    print(
        f"Combine clips took {round(time.time() - start_time, 2)} seconds.")

    filepath = combine_clips_response

    remove_segment_query = {
        'video_filepath': filepath, 'start': 10.0, 'end': 20.0}
    start_time = time.time()
    remove_segment_response = asyncio.run(
        remove_segment(**remove_segment_query))
    print(
        f"Remove segment took {round(time.time() - start_time, 2)} seconds.")
