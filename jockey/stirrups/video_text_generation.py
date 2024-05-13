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
GIST_URL = urllib.parse.urljoin(TL_BASE_URL, "gist/")
SUMMARIZE_URL = urllib.parse.urljoin(TL_BASE_URL, "summarize/")
GENERATE_URL = urllib.parse.urljoin(TL_BASE_URL, "generate/")


class PegasusGistInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    endpoint_options: List[str] = Field(description="""Determines what outputs to generate.
                                                    Can be any combination of: ['topic', 'hashtag', 'title'].""")
    

class PegasusSummarizeInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    endpoint_option: str = Field(description="""Determines what outputs to generate.
                                             Must be exactly one of of: ['summary', 'highlight', 'chapter'].""")
    prompt: Union[str | None] = Field(description="Custom instructions that can influence how text is generated or structured.")
    

class PegasusFreeformInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    prompt: str = Field(description="Any type of custom instructions to be used when generating any type of text output.")


@tool("gist-text-generation", args_schema=PegasusGistInput)
async def gist_text_generation(video_id: str, index_id: str, endpoint_options: List[str]) -> Dict:
    """Generate `gist` output for a single video. This can include any combination of: topics, hashtags, and a title"""

    headers = {
            "accept": "application/json",
            "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
            "Content-Type": "application/json"
        }
    
    payload = {
        "video_id": video_id,
        "types": endpoint_options
    }

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    
    response = requests.post(GIST_URL, json=payload, headers=headers)
    response = response.json()

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    response["video_url"] = video_metadata.json()["hls"]["video_url"]

    return response


@tool("summarize-text-generation", args_schema=PegasusSummarizeInput)
async def summarize_text_generation(video_id: str, index_id: str, endpoint_option: str, prompt: Union[str | None] = None) -> Dict:
    """Generate `summary` `highlight` or `chapter` for a single video. This can include any combination of: topics, hashtags, and a title"""

    headers = {
            "accept": "application/json",
            "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
            "Content-Type": "application/json"
        }
    
    payload = {
        "video_id": video_id,
        "type": endpoint_option,
    }

    if prompt is not None:
        payload["prompt"] = prompt

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    
    response = requests.post(SUMMARIZE_URL, json=payload, headers=headers)
    response = response.json()

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    response["video_url"] = video_metadata.json()["hls"]["video_url"]

    return response


@tool("freeform-text-generation", args_schema=PegasusFreeformInput)
async def free_text_generation(video_id: str, index_id: str, prompt: str) -> Dict:
    """Generate any type of text output for a single video.
    Useful for answering specific questions, understanding fine grained details, and anything else that doesn't fall neatly into the other tools."""

    headers = {
            "accept": "application/json",
            "x-api-key": os.environ["TWELVE_LABS_API_KEY"],
            "Content-Type": "application/json"
        }
    
    payload = {
        "video_id": video_id,
        "prompt": prompt,
    }

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    
    response = requests.post(GENERATE_URL, json=payload, headers=headers)
    response = response.json()

    video_metadata = get_video_metadata(video_id=video_id, index_id=index_id)
    response["video_url"] = video_metadata.json()["hls"]["video_url"]

    return response


async def call_tools(message: AIMessage) -> Runnable:
    video_text_generation_tools = [gist_text_generation, summarize_text_generation, free_text_generation]
    tool_map = {tool.name: tool for tool in video_text_generation_tools}
    tool_calls = message.tool_calls.copy()

    for tool_call in tool_calls:
        tool_call["output"] = await tool_map[tool_call["name"]].ainvoke(tool_call["args"])
    return tool_calls


def build_video_text_generation_worker(worker_llm):
    if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
        raise TypeError(f"LLM type must be one of: [BaseChatOpenAI, AzureChatOpenAI]. Got type: {type(worker_llm).__name__}.")
    
    prompt_filepath = os.path.join(os.path.curdir, "prompts", "video_text_generation.md")

    with open(prompt_filepath, "r") as prompt_file:
        system_prompt = prompt_file.read()
        
    video_text_generation_tools = [gist_text_generation, summarize_text_generation, free_text_generation]
    
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system", system_prompt,
            ),
            MessagesPlaceholder("chat_history"),
        ]
    )

    llm_with_tools = worker_llm.bind_tools(video_text_generation_tools)
    video_text_generation_worker = prompt | llm_with_tools | call_tools
    video_text_generation_worker.name = "video-text-generation"

    return video_text_generation_worker
