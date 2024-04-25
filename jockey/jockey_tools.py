import urllib
import requests
import os
import ffmpeg
from langchain.tools import tool
from langchain.pydantic_v1 import BaseModel, Field
from typing import List, Dict, Union
from util import get_video_metadata, download_video


TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urllib.parse.urljoin(TL_BASE_URL, "indexes/")
EXTERNAL_UPLOAD_URL = urllib.parse.urljoin(TL_BASE_URL, "tasks/external-provider/")
SEARCH_URL = urllib.parse.urljoin(TL_BASE_URL, "search/")
GIST_URL = urllib.parse.urljoin(TL_BASE_URL, "gist/")
SUMMARIZE_URL = urllib.parse.urljoin(TL_BASE_URL, "summarize/")
GENERATE_URL = urllib.parse.urljoin(TL_BASE_URL, "generate/")

class MarengoSearchInput(BaseModel):
    query: str | dict = Field(description="Search query to run on a collection of videos.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    top_n: int = Field(description="Used to select the top N results of a search.", gt=0, le=10)
    group_by: str = Field(description="Used to decide how to group search results. Must be one of: `clip` or `video`.")
    video_filter: List[str] = Field(description="Filter search results to only include results from video IDs in this list.")


@tool("video-search", args_schema=MarengoSearchInput)
def video_search(query: str | dict, index_id: str, top_n: int = 3, group_by: str = "clip", video_filter: list = None) -> Union[List[Dict], List]:
    """Run a search query against a collection of videos and get results. Search queries can be or complex.
    Simple Query Example: {"text": "a dog playing with a yellow and white tennis ball"}

    Complex queries use logical operators to wrap simple queries. Here are the logical operators you can use:
        $and -- every simple search query must be true for a result to appear
            {$and: [<simple_query_1>, <simple_query_2>, ...]}
        $or -- only a single simple query must be true for a result to appear
            {$or: [<simple_query_1>, <simple_query_2>, ...]}
        $not: -- consists of "origin" and "sub" keys where origin is the inclusive set of queries and sub is exclusionary 
            {$not: {"origin": {<simple_query>} | [<logical_operator_queries>], "sub": {<simple_query>} | [<logical_operator_queries>]}"""
    headers = {
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    payload = {
        "search_options": ["visual"],
        "group_by": group_by,
        "threshold": "low",
        "sort_option": "score",
        "conversation_option": "semantic",
        "page_limit": top_n,
        "index_id": index_id,
        "query": query
    }

    if filter is not None:
        payload["filter"] = {"id": video_filter}

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
        top_n_results = [{"video_id": video["id"]} for video in response.json()["data"][:top_n]]
    else:
        top_n_results = response.json()["data"][:top_n]

    for result in top_n_results:
        video_id = result["video_id"]

        response = get_video_metadata(video_id=video_id, index_id=index_id)

        if response.status_code != 200:
            error_response = {
                "message": "There was an API error when retrieving video metadata.",
                "video_id": video_id,
                "response": response.text
            }
            return error_response
        
        result["video_url"] = response.json()["hls"]["video_url"]

        if group_by == "video":
            result["thumbnail_url"] = response.json()["hls"]["thumbnail_urls"][0]

    return top_n_results


class CombineClipsInput(BaseModel):
    clips: List = Field(description="""Clip results found using the video-search tool.""")
    queries: List[str] = Field(description="The search queries passed to the video-search tool to find the clips. One for each clip.")
    output_filename: str = Field(description="The output filename of the combined clips. Must be in the form: [filename].mp4")
    index_id: str = Field(description="Index ID the clips belong to.")


@tool("combine-clips", args_schema=CombineClipsInput)
def combine_clips(clips: List[Dict], queries: List[str] | List[dict], output_filename: str, index_id: str) -> str:
    """Combine or edit multiple clips together based on video IDs that are results from the video-search tool. The full filepath for the combined clips is returned."""
    try:
        input_streams = []
        arial_font_file = os.path.join(os.getcwd(), "assets", "fonts", "Arial.ttf")

        for clip, query in zip(clips, queries):
            video_id = clip["video_id"]
            start = clip["start"]
            end = clip["end"]
            video_filepath = os.path.join(os.getcwd(), index_id, f"{video_id}_{start}_{end}.mp4")

            if os.path.isfile(video_filepath) is False:
                download_video(video_id=video_id, index_id=index_id, start=start, end=end)

            video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video
            audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio
            clip_with_text_stream = video_input_stream.drawtext(text=query, x="(w-text_w)/2", fontfile=arial_font_file, box=1, 
                                                                boxcolor="black", fontcolor="white", fontsize=28)
            
            input_streams.append(clip_with_text_stream)
            input_streams.append(audio_input_stream)

        output_filepath = os.path.join(os.getcwd(), index_id, output_filename)
        ffmpeg.concat(*input_streams, v=1, a=1).output(output_filepath, acodec="libmp3lame").overwrite_output().run()

        return output_filepath
    except Exception as error:
        error_response = {
            "message": "There was a video editing error.",
            "error": error
        }
        return error_response


class RemoveSegmentInput(BaseModel):
    video_filepath: str = Field(description="Full path to target video file.")
    start: float = Field(description="""Start time of segment to be removed. Must be in the format of: seconds.milliseconds""")
    end: float = Field(description="""End time of segment to be removed. Must be in the format of: seconds.milliseconds""")


@tool("remove-segment", args_schema=RemoveSegmentInput)
def remove_segment(video_filepath: str, start: float, end: float) -> str:
    """Remove a segment from a video at specified start and end times The full filepath for the edited video is returned."""
    output_filepath = f"{os.path.splitext(video_filepath)[0]}_clipped.mp4"

    left_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=0, end=start).filter("setpts", "PTS-STARTPTS")
    left_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=0, end=start).filter("asetpts", "PTS-STARTPTS")
    right_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=end).filter("setpts", "PTS-STARTPTS")
    right_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=end).filter("asetpts", "PTS-STARTPTS")

    streams = [left_cut_video_stream, left_cut_audio_stream, right_cut_video_stream, right_cut_audio_stream]

    ffmpeg.concat(*streams, v=1, a=1).output(filename=output_filepath, acodec="libmp3lame").overwrite_output().run()

    return output_filepath


class PegasusGenerateInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    endpoint: str = Field(description="""What type of text to generate from a video: must be one of: ['gist', 'summarize', 'generate']""")
    prompt: str = Field(default=None, description="""The prompt to be used by the video foundation model to generate text output.
                                                  Can be used with the `summarize` or `generate` endpoints. Must be 300 characters or less.""")
    endpoint_options: Union[str, List[str]] = Field(default=None, 
                                                    description="""Determines what the user wishes to generate. Required for `summarize` and `gist` endpoints.
                                                                For the 'summarize' endpoint must be exactly one of: ['summary', 'highlight', 'chapter'].
                                                                For the 'gist' endpoint can be any combination of: ['topic', 'hashtag', 'title'].
                                                                There are no `endpoint_options` for the `generate` endpoint.""")


@tool("video-text-generation", args_schema=PegasusGenerateInput)
async def video_text_generation(video_id: str, endpoint: str, prompt: str = None, endpoint_options: Union[str, List[str]] = None):
    """Generate text output for a single video based on what the user wants to know."""

    headers = {
            "accept": "application/json",
            "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
            "Content-Type": "application/json"
        }
    
    payload = {
        "video_id": video_id
    }

    url = None

    if endpoint == "gist":
        url = GIST_URL

        if endpoint_options is not None:
            payload["types"] = endpoint_options
    elif endpoint == "summarize":
        url = SUMMARIZE_URL

        if endpoint_options is not None:
            payload["type"] = endpoint_options
    if endpoint == "generate":
        url = GENERATE_URL

    if prompt is not None:
        payload["prompt"] = prompt

    response = requests.post(url, json=payload, headers=headers)

    return response.json()

JOCKEY_TOOLKIT = [video_search, combine_clips, remove_segment, video_text_generation]
