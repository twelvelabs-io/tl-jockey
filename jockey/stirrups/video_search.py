import requests
import urllib
import os
from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import tool
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable
from langchain_core.messages import AIMessage
from typing import Dict, List, Union
from util import get_video_metadata


TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
SEARCH_URL = urllib.parse.urljoin(TL_BASE_URL, "search/")



class MarengoSearchInput(BaseModel):
    query: str | dict = Field(description="Search query to run on a collection of videos.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    top_n: int = Field(description="Used to select the top N `clips` or videos` from search results.", gt=0, le=10, default=3)
    group_by: str = Field(description="Used to decide if searching at a clip or video level. Must be one of: `clip` or `video`."
                          "Use `video` when you see the word `video` in the supervisors instructions. Otherwise use `clip`.", default="clip")
    search_options: List[str] = Field(description="Which modalities to consider when running a query on a collections of videos"
                                      "Must be one or more of: 'visual', 'conversation'"
                                      "Use both modalities by default unless the supervisor instructs you otherwise."
                                      "Queries that require consideration of visual and conversation should use both modalities."
                                      "Keep in mind that the `visual` modality includes non-conversation audio like laughing, music, etc.",
                                      default=["visual", "conversation"])
    video_filter: List[str] | None = Field(description="Filter search results to only include results from video IDs in this list."
                                           "This is different from the Index ID."
                                           "It should be used when a user wants to search within a specific video or set of videos.",
                                    default=None)


async def base_video_search(query: str, 
    index_id: str, 
    top_n: int = 3, 
    group_by: str = "clip",
    search_options: List[str] = ["visual", "conversation"],
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
    
    return top_n_results


@tool("simple-video-search", args_schema=MarengoSearchInput, return_direct=True)
async def simple_video_search(
    query: str, 
    index_id: str, 
    top_n: int = 3, 
    group_by: str = "clip",
    search_options: List[str] = ["visual", "conversation"],
    video_filter: List[str] | None = None, *args, **kwargs) -> Union[List[Dict], List]:
    """Run a simple search query against a collection of videos and get results. 
    Query Example: "a dog playing with a yellow and white tennis ball"""

    search_results = await base_video_search(query, index_id, top_n, group_by, search_options, video_filter)

    return search_results


async def call_tools(message: AIMessage) -> Runnable:
    video_search_tools = [simple_video_search]
    tool_map = {tool.name: tool for tool in video_search_tools}
    tool_calls = message.tool_calls.copy()

    for tool_call in tool_calls:
        tool_call["output"] = await tool_map[tool_call["name"]].ainvoke(tool_call["args"])
    return tool_calls


def build_video_search_worker(worker_llm):
    if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
        raise TypeError(f"LLM type must be one of: [BaseChatOpenAI, AzureChatOpenAI]. Got type: {type(worker_llm).__name__}.")
    
    prompt_filepath = os.path.join(os.path.curdir, "prompts", "video_search.md")

    with open(prompt_filepath, "r") as prompt_file:
        system_prompt = prompt_file.read()
    
    video_search_tools = [simple_video_search]
    video_search_tool_descriptions = str.join(", ", [str(tool) for tool in video_search_tools])
    
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system", system_prompt,
            ),
            MessagesPlaceholder("chat_history"),
        ]
    ).partial(video_search_tool_descriptions=video_search_tool_descriptions)

    llm_with_tools = worker_llm.bind_tools(video_search_tools)
    video_search_worker = prompt | llm_with_tools | call_tools
    video_search_worker.name = "video-search"

    return video_search_worker
