import requests
import json
import urllib
import os
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import tool
from typing import Dict, List, Union
from enum import Enum
from jockey.stirrups.errors import ErrorType, JockeyError, NodeType, WorkerFunction, create_jockey_error_event
from jockey.video_utils import get_video_metadata
from jockey.prompts import DEFAULT_VIDEO_SEARCH_FILE_PATH
from jockey.stirrups.stirrup import Stirrup
from config import DEBUG

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
SEARCH_URL = urllib.parse.urljoin(TL_BASE_URL, "search")


def debug_print(*args, **kwargs):
    """Helper function to print debug messages only when DEBUG is True."""
    if DEBUG:
        print("[DEBUG]", *args, **kwargs)


class GroupByEnum(str, Enum):
    """Helps to ensure the video-search worker selects a valid `group_by` option."""

    CLIP = "clip"
    VIDEO = "video"


class SearchOptionsEnum(str, Enum):
    """Helps to ensure the video-search worker selects valid `search_options`."""

    VISUAL = "visual"
    CONVERSATION = "conversation"
    TEXT_IN_VIDEO = "text_in_video"
    LOGO = "logo"


class MarengoSearchInput(BaseModel):
    """Help to ensure the video-search worker provides valid arguments to any tool it calls."""

    query: Union[str, dict] = Field(description="Search query to run on a collection of videos.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    top_n: int = Field(description="Get the top N clips or videos as search results.", default=3)
    group_by: GroupByEnum = Field(description="Search for clips or videos.", default=GroupByEnum.CLIP)
    search_options: List[SearchOptionsEnum] = Field(
        description="Which modalities to consider when running a query on a collections of videos.",
        default=[SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION],
    )
    video_filter: Union[List[str], None] = Field(
        description="Filter search results to only include results from video IDs in this list.", default=None
    )


async def _base_video_search(
    query: str,
    index_id: str,
    top_n: int = 3,
    group_by: GroupByEnum = GroupByEnum.CLIP,
    search_options: List[SearchOptionsEnum] = [SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION],
    video_filter: Union[List[str], None] = None,
) -> Union[List[Dict], List]:
    debug_print(f"Starting _base_video_search with query: {query}, index_id: {index_id}")
    headers = {"x-api-key": os.environ["TWELVE_LABS_API_KEY"], "accept": "application/json", "Content-Type": "application/json"}

    payload = {
        "search_options": search_options,
        "group_by": group_by,
        "threshold": "low",
        "sort_option": "score",
        "conversation_option": "semantic",
        "page_limit": top_n,
        "index_id": index_id,
        "query": query,
    }

    if video_filter is not None:
        payload["filter"] = {"id": video_filter}

    debug_print(f"Sending request to {SEARCH_URL} with payload: {json.dumps(payload, indent=2)}")
    video_metadata = requests.post(SEARCH_URL, json=payload, headers=headers)
    debug_print(f"Response status code: {video_metadata.status_code}")

    if video_metadata.status_code != 200:
        print(f"[ERROR] API request failed with status {video_metadata.status_code}: {video_metadata.text}")
        error_response = {
            "message": "There was an API error when searching the index.",
            "url": SEARCH_URL,
            "headers": headers,
            "json_payload": payload,
            "response": video_metadata.text,
        }
        return error_response

    if group_by == "video":
        top_n_results = [{"video_id": video["id"]} for video in video_metadata.json()["data"][:top_n]]
    else:
        top_n_results = video_metadata.json()["data"][:top_n]

    for result in top_n_results:
        video_id = result["video_id"]

        video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)

        if isinstance(video_metadata, dict) and "error" in video_metadata:
            error_response = {
                "message": "There was an API error when retrieving video metadata.",
                "video_id": video_id,
                "response": video_metadata["error"],
            }
            return error_response

        video_data = video_metadata.json()

        if "video_url" not in result or not result["video_url"]:
            result["video_url"] = video_data["hls"]["video_url"]

        result["video_title"] = video_data["metadata"]["filename"]

        if group_by == "video":
            result["thumbnail_url"] = video_data["hls"]["thumbnail_urls"][0]

    top_n_results = json.dumps(top_n_results)

    debug_print(f"Processed {len(top_n_results)} results")
    return top_n_results


def extract_modalities(search_results):
    debug_print(f"Extracting modalities from search results: {json.dumps(search_results, indent=2)}")
    modalities = set()
    for result in search_results:
        modules = result.get("modules", [])
        debug_print(f"Found modules: {modules}")
        for module in modules:
            modalities.add(module.get("type"))
    debug_print(f"Extracted modalities: {modalities}")
    return list(modalities)


@tool("simple-video-search", args_schema=MarengoSearchInput, return_direct=True)
async def simple_video_search(
    query: str,
    index_id: str,
    top_n: int = 3,
    group_by: GroupByEnum = GroupByEnum.CLIP,
    search_options: List[SearchOptionsEnum] = [SearchOptionsEnum.VISUAL, SearchOptionsEnum.CONVERSATION],
    video_filter: Union[List[str], None] = None,
) -> Union[List[Dict], List]:
    debug_print(f"Starting simple_video_search with query: {query}")

    try:
        search_results = await _base_video_search(query, index_id, top_n, group_by, search_options, video_filter)
        debug_print(f"Search results type: {type(search_results)}")

        if isinstance(search_results, list):
            try:
                debug_print(f"Attempting to extract modalities from: {search_results}")
                available_modalities = extract_modalities(search_results)
                if not available_modalities:
                    print("[WARNING] No modalities were found in search results")
                    return {"success": False, "results": search_results, "available_modalities": available_modalities, "error": "No modalities found"}
                debug_print(f"Successfully extracted modalities: {available_modalities}")
                return {"success": True, "results": search_results, "available_modalities": available_modalities}
            except Exception as error:
                print(f"[ERROR] Failed to extract modalities: {str(error)}")
                jockey_error = JockeyError.create(
                    node=NodeType.WORKER,
                    error_type=ErrorType.SEARCH,
                    function_name=WorkerFunction.VIDEO_SEARCH,
                    details=f"Error: {str(error)}",
                )
                raise jockey_error
        else:
            print(f"[ERROR] Search returned non-list result: {search_results}")
            return search_results

    except Exception as error:
        print(f"[ERROR] Search operation failed: {str(error)}")
        jockey_error = JockeyError.create(
            node=NodeType.WORKER,
            error_type=ErrorType.SEARCH,
            function_name=WorkerFunction.VIDEO_SEARCH,
            details=f"Error: {str(error)}",
        )
        raise jockey_error


# Construct a valid worker for a Jockey instance.
video_search_worker_config = {
    "tools": [simple_video_search],
    "worker_prompt_file_path": DEFAULT_VIDEO_SEARCH_FILE_PATH,
    "worker_name": "video-search",
}
VideoSearchWorker = Stirrup(**video_search_worker_config)
