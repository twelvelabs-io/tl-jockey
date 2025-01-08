import os
import ffmpeg
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List, Dict, Union
from jockey.video_utils import download_video
from jockey.prompts import DEFAULT_VIDEO_EDITING_FILE_PATH
from jockey.stirrups.stirrup import Stirrup
from jockey.stirrups.errors import JockeyError, NodeType, WorkerFunction, ErrorType
import uuid

CODEC_FAMILIES = {"mpeg": {"h264", "hevc", "mpeg4"}, "vp": {"vp8", "vp9"}, "av1": {"av1"}}

CODEC_FAMILIES = {
    'mpeg': {'h264', 'hevc', 'mpeg4'},
    'vp': {'vp8', 'vp9'},
    'av1': {'av1'}
}

class Clip(BaseModel):
    """Define what constitutes a clip in the context of the video-editing worker."""

    score: float = Field(description="The score of the clip from the search.")
    start: float = Field(description="The start time of the clip in seconds.")
    end: float = Field(description="The end time of the clip in seconds.")
    metadata: list = Field(description="The metadata of the clip from the search.")
    video_id: str = Field(description="A UUID for the video a clip belongs to.")
    confidence: str
    thumbnail_url: str
    video_url: str
    video_title: str

    def __json__(self):
        """Make Clip JSON serializable."""
        return self.model_dump()


# sent to openai tool call
class SimplifiedCombineClipsInput(BaseModel):
    output_filename: str = Field(description="The output filename of the combined clips. Must be in the form: [filename].mp4")


# used by the worker
class CombineClipsInput(BaseModel):
    """Ensure the video-editing worker has required inputs for the `@combine_clips` tool."""

    clips: List[Clip] = Field(description="List of clips to be edited together. Each clip must have start and end times and a Video ID.")
    output_filename: str = Field(description="The output filename of the combined clips. Must be in the form: [filename].mp4")
    index_id: str = Field(description="Index ID the clips belong to.")


class RemoveSegmentInput(BaseModel):
    """Helps to ensure the video-editing worker providers all required information for clips when using the `remove_segment` tool."""

    video_filepath: str = Field(description="Full path to target video file.")
    start: float = Field(description="""Start time of segment to be removed. Must be in the format of: seconds.milliseconds""")
    end: float = Field(description="""End time of segment to be removed. Must be in the format of: seconds.milliseconds""")

def are_codecs_compatible(codecs):
    for family in CODEC_FAMILIES.values():
        if codecs.issubset(family):
            return True
    return False

def check_video_codecs(video_filepaths):
    codecs = set()
    for filepath in video_filepaths:
        probe = ffmpeg.probe(filepath)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        if video_stream:
            codecs.add(video_stream['codec_name'])
    return codecs

@tool("combine-clips", args_schema=CombineClipsInput)
async def combine_clips(clips: List[Clip], output_filename: str, index_id: str) -> Union[str, Dict]:
    # """Combine or edit multiple clips together based on their start and end times and video IDs.
    # The full filepath for the combined clips is returned. Return a Union str if successful, or a Dict if an error occurs."""

    # Add a random UUID before the .mp4 extension to the output filename to avoid overwriting existing files

    try:
        # Input validation first
        for clip in clips:
            if clip.start < 0:
                raise ValueError(f"Invalid start time: {clip.start}. Start time cannot be negative.")

        input_streams = []
        video_filepaths = []

        for clip in clips:
            video_id = clip.video_id
            start = clip.start
            end = clip.end
            video_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, f"{video_id}_{start}_{end}.mp4")
            video_filepaths.append(video_filepath)
            if os.path.isfile(video_filepath) is False:
                try:
                    download_video(video_id=video_id, index_id=index_id, start=start, end=end)
                except AssertionError as error:
                    error_response = {
                        "message": f"There was an error retrieving the video metadata for Video ID: {video_id} in Index ID: {index_id}. "
                        "Double check that the Video ID and Index ID are valid and correct.",
                        "error": str(error),
                    }
                    continue

            clip_video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").video
            clip_audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").audio
            clip_video_input_stream = clip_video_input_stream.filter("setpts", "PTS-STARTPTS")
            clip_audio_input_stream = clip_audio_input_stream.filter("asetpts", "PTS-STARTPTS")

            input_streams.extend([clip_video_input_stream, clip_audio_input_stream])

        output_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, output_filename)
        ffmpeg.concat(*input_streams, v=1, a=1).output(
            output_filepath, vcodec="libx264", acodec="libmp3lame", video_bitrate="1M", audio_bitrate="192k"
        ).overwrite_output().run()

        output_filepath = f"{uuid.uuid4().hex}_{output_filepath}"
        return output_filepath

    except JockeyError:
        # propagate JockeyError as is
        raise

    except Exception as error:
        # other errors
        jockey_error = JockeyError.create(
            node=NodeType.WORKER,
            error_type=ErrorType.VIDEO,
            function_name=WorkerFunction.COMBINE_CLIPS,
            details=f"Error: {str(error)}",
        )
        raise jockey_error


# @tool("remove-segment", args_schema=RemoveSegmentInput)
# async def remove_segment(video_filepath: str, start: float, end: float) -> Union[str, Dict]:
#     # """Remove a segment from a video at specified start and end times. The full filepath for the edited video is returned. Return a Union str if successful, or a Dict if an error occurs."""
#     try:
#         output_filepath = f"{os.path.splitext(video_filepath)[0]}_clipped.mp4"
#         left_cut_video_stream = (
#             ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=0, end=start).filter("setpts", "PTS-STARTPTS")
#         )
#         left_cut_audio_stream = (
#             ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=0, end=start).filter("asetpts", "PTS-STARTPTS")
#         )
#         right_cut_video_stream = (
#             ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=end).filter("setpts", "PTS-STARTPTS")
#         )
#         right_cut_audio_stream = (
#             ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=end).filter("asetpts", "PTS-STARTPTS")
#         )
#         streams = [left_cut_video_stream, left_cut_audio_stream, right_cut_video_stream, right_cut_audio_stream]
#         ffmpeg.concat(*streams, v=1, a=1).output(filename=output_filepath, acodec="libmp3lame").overwrite_output().run()
#         return output_filepath
#     except Exception as error:
#         jockey_error = JockeyError.create(
#             node=NodeType.WORKER,
#             error_type=ErrorType.VIDEO,
#             function_name=WorkerFunction.REMOVE_SEGMENT,
#             details=f"Error: {str(error)}",
#         )
#         raise jockey_error


# Construct a valid worker for a Jockey instance.
video_editing_worker_config = {
    "tools": [combine_clips],
    "worker_prompt_file_path": DEFAULT_VIDEO_EDITING_FILE_PATH,
    "worker_name": "video-editing",
}
VideoEditingWorker = Stirrup(**video_editing_worker_config)
