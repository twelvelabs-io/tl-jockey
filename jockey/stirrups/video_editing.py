import os
import ffmpeg
from langchain.tools import tool
from langchain.pydantic_v1 import BaseModel, Field
from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable
from langchain_core.messages import AIMessage
from typing import List, Dict
from util import download_video


class Clip(BaseModel):
    video_id: str
    start: float
    end: float


class CombineClipsInput(BaseModel):
    clips: List[Clip] = Field(description="""List of clips to be edited together. Each clip must have start and end times and a Video ID.""")
    output_filename: str = Field(description="The output filename of the combined clips. Must be in the form: [filename].mp4")
    index_id: str = Field(description="Index ID the clips belong to.")


@tool("combine-clips", args_schema=CombineClipsInput)
def combine_clips(clips: List[Dict], output_filename: str, index_id: str) -> str:
    """Combine or edit multiple clips together based on their start and end times and video IDs. 
    The full filepath for the combined clips is returned."""
    try:
        input_streams = []

        for clip in clips:
            video_id = clip.video_id
            start = clip.start
            end = clip.end
            video_filepath = os.path.join(os.getcwd(), index_id, f"{video_id}_{start}_{end}.mp4")

            if os.path.isfile(video_filepath) is False:
                download_video(video_id=video_id, index_id=index_id, start=start, end=end)

            clip_video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video
            clip_audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio
            
            input_streams.append(clip_video_input_stream)
            input_streams.append(clip_audio_input_stream)

        output_filepath = os.path.join(os.getcwd(), index_id, output_filename)
        ffmpeg.concat(*input_streams, v=1, a=1).output(output_filepath, acodec="libmp3lame").overwrite_output().run()

        return output_filepath
    except Exception as error:
        print(error)
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


async def call_tools(message: AIMessage) -> Runnable:
    video_editing_tools = [combine_clips, remove_segment]
    tool_map = {tool.name: tool for tool in video_editing_tools}
    tool_calls = message.tool_calls.copy()

    for tool_call in tool_calls:
        tool_call["output"] = await tool_map[tool_call["name"]].ainvoke(tool_call["args"])
    return tool_calls


def build_video_editing_worker(worker_llm):
    if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
        raise TypeError(f"LLM type must be one of: [BaseChatOpenAI, AzureChatOpenAI]. Got type: {type(worker_llm).__name__}.")
    
    prompt_filepath = os.path.join(os.path.curdir, "prompts", "video_editing.md")

    with open(prompt_filepath, "r") as prompt_file:
        system_prompt = prompt_file.read()
    
    video_search_tools = [combine_clips, remove_segment]
    video_search_tool_descriptions = str.join(", ", [str(tool) for tool in video_search_tools])
    
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system", system_prompt,
            ),
            MessagesPlaceholder("chat_history"),
        ]
    )

    llm_with_tools = worker_llm.bind_tools(video_search_tools)
    video_search_worker = prompt | llm_with_tools | call_tools
    video_search_worker.name = "video-editing"

    return video_search_worker