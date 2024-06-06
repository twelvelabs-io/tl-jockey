import requests
import json
import urllib
import os
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import tool
from typing import Dict, List, Union
from enum import Enum
from jockey.util import get_video_metadata
from jockey.prompts import DEFAULT_VIDEO_SEARCH_FILE_PATH
from jockey.stirrups.stirrup import Stirrup

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
SEARCH_URL = urllib.parse.urljoin(TL_BASE_URL, "search/")


class GroupByEnum(str, Enum):
    """Helps to ensure the video-search worker selects a valid `group_by` option."""
    CLIP = "clip"
    VIDEO = "video"


class SearchOptionsEnum(str, Enum):
    """Helps to ensure the video-search worker selects valid `search_options`."""
    VISUAL = "visual"
    CONVERSATION = "conversation"


class MarengoSearchInput(BaseModel):
    """Help to ensure the video-search worker provides valid arguments to any tool it calls."""
    query: str | dict = Field(description="Search query to run on a collection of videos.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    top_n: int = Field(description="Get the top N clips or videos as search results.", gt=0, le=10, default=3)
    group_by: GroupByEnum = Field(description="Search for clips or videos.", default=GroupByEnum.CLIP)
    search_options: List[SearchOptionsEnum] = Field(description="Which modalities to consider when running a query on a collections of videos.", 
                                                default=[SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION])
    video_filter: List[str] | None = Field(description="Filter search results to only include results from video IDs in this list.", 
                                           default=None)


async def _base_video_search(
    query: str, 
    index_id: str, 
    top_n: int = 3, 
    group_by: GroupByEnum = GroupByEnum.CLIP,
    search_options: List[SearchOptionsEnum] = [SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION],
    video_filter: List[str] | None = None) -> Union[List[Dict], List]:

    headers = {
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    payload = {
        "search_options": search_options,
        "group_by": group_by,
        "threshold": "low",
        "sort_option": "score",
        "conversation_option": "semantic",
        "page_limit": top_n,
        "index_id": index_id,
        "query": query
    }

    if video_filter is not None:
        payload["filter"] = {"id": video_filter}

    video_metadata = requests.post(SEARCH_URL, json=payload, headers=headers)

    if video_metadata.status_code != 200:
        error_response = {
            "message": "There was an API error when searching the index.",
            "url": SEARCH_URL,
            "headers": headers,
            "json_payload": payload,
            "response": video_metadata.text
        }
        return error_response

    if group_by == "video":
        top_n_results = [{"video_id": video["id"]} for video in video_metadata.json()["data"][:top_n]]
    else:
        top_n_results = video_metadata.json()["data"][:top_n]

    for result in top_n_results:
        video_id = result["video_id"]

        video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)

        if video_metadata.status_code != 200:
            error_response = {
                "message": "There was an API error when retrieving video metadata.",
                "video_id": video_id,
                "response": video_metadata.text
            }
            return error_response
        
        result["video_url"] = video_metadata.json()["hls"]["video_url"]
        result["video_title"] = video_metadata.json()["metadata"]["filename"]

        if group_by == "video":
            result["thumbnail_url"] = video_metadata.json()["hls"]["thumbnail_urls"][0]

    top_n_results = json.dumps(top_n_results)
    
    return top_n_results


@tool("simple-video-search", args_schema=MarengoSearchInput, return_direct=True)
async def simple_video_search(
    query: str, 
    index_id: str, 
    top_n: int = 3, 
    group_by: GroupByEnum = GroupByEnum.CLIP,
    search_options: List[SearchOptionsEnum] = [SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION],
    video_filter: List[str] | None = None) -> Union[List[Dict], List]:
    """Run a simple search query against a collection of videos and get results. 
    Query Example: "a dog playing with a yellow and white tennis ball"""

    search_results = await _base_video_search(query, index_id, top_n, group_by, search_options, video_filter)

    return search_results


# Construct a valid worker for a Jockey instance.
video_search_worker_config = {
    "tools": [simple_video_search],
    "worker_prompt_file_path": DEFAULT_VIDEO_SEARCH_FILE_PATH,
    "worker_name": "video-search"
}
VideoSearchWorker = Stirrup(**video_search_worker_config)
