import requests
import json
import urllib
import os
from langchain.pydantic_v1 import BaseModel, Field
from pydantic.functional_validators import AfterValidator
from langchain.tools import tool
from typing import Dict, List, Union, Annotated
from enum import Enum
from util import get_video_metadata
from .stirrup import Stirrup


TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
GIST_URL = urllib.parse.urljoin(TL_BASE_URL, "gist/")
SUMMARIZE_URL = urllib.parse.urljoin(TL_BASE_URL, "summarize/")
GENERATE_URL = urllib.parse.urljoin(TL_BASE_URL, "generate/")


class GistEndpointEnum(str, Enum):
    TOPIC = "topic"
    HASHTAG = "hashtag"
    TITLE = "title"


class SummarizeEndpointEnum(str, Enum):
    SUMMARY = "summary"
    HIGHLIGHT = "highlight"
    CHAPTER = "chapter"


def _validate_prompt_length(prompt: str) -> bool:
    assert prompt.strip(" ") <= 300
    return prompt

GeneratePrompt = Annotated[str, AfterValidator(_validate_prompt_length)]


class PegasusGistInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    endpoint_options: List[GistEndpointEnum] = Field(description="Determines what outputs to generate.")
    

class PegasusSummarizeInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    endpoint_option: SummarizeEndpointEnum = Field(description="Determines what output to generate.")
    prompt: Union[GeneratePrompt | None] = Field(description="Custom instructions that can influence how text is generated or structured.")
    

class PegasusFreeformInput(BaseModel):
    video_id: str = Field(description="The ID of the video to generate text from.")
    index_id: str = Field(description="Index ID which contains a collection of videos.")
    prompt: GeneratePrompt = Field(description="Any type of custom instructions to be used when generating any type of text output.")


@tool("gist-text-generation", args_schema=PegasusGistInput)
async def gist_text_generation(video_id: str, index_id: str, endpoint_options: List[GistEndpointEnum]) -> Dict:
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

    response = json.dumps(response)

    return response


@tool("summarize-text-generation", args_schema=PegasusSummarizeInput)
async def summarize_text_generation(video_id: str, index_id: str, endpoint_option: SummarizeEndpointEnum, prompt: Union[str | None] = None) -> Dict:
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

    response = json.dumps(response)

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

    response = json.dumps(response)

    return response


video_text_generation_worker_config = {
    "tools": [gist_text_generation, summarize_text_generation, free_text_generation],
    "worker_prompt_file_path": os.path.join(os.path.curdir, "prompts", "video_text_generation.md"),
    "worker_name": "video-text-generation"
}
VideoTextGenerationWorker = Stirrup(**video_text_generation_worker_config)
