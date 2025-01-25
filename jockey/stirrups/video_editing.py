import hashlib
import json
import os
import ffmpeg
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List, Dict, Union
from jockey.video_utils import download_video
from jockey.prompts import DEFAULT_VIDEO_EDITING_FILE_PATH
from jockey.stirrups.stirrup import Stirrup
from jockey.video_utils import get_filename
from jockey.spaces.spaces import Spaces


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
    clip_url: str
    clip_id: str  # if the clip filename is clip-67051e284ecef42224b923fe_18b214dd.mp4, the clip_id is 67051e284ecef42224b923fe_18b214dd

    def __json__(self):
        """Make Clip JSON serializable."""
        return self.model_dump()


class CombinedClip(BaseModel):
    video_id: str  # if filename is combined-17282916.mp4, the video_id is 17282916
    video_url: str
    clips_used: Dict[str, Clip]  # clip_id : Clip

    def __json__(self):
        """Make CombinedClip JSON serializable."""
        return self.model_dump()


# used by the worker
class CombineClipsInput(BaseModel):
    """Ensure the video-editing worker has required inputs for the `@combine_clips` tool."""

    clips: List[Clip] = Field(description="List of clips to be edited together. Each clip must have start and end times and a Video ID.")
    index_id: str = Field(description="Index ID the clips belong to.")


class RemoveSegmentInput(BaseModel):
    """Helps to ensure the video-editing worker providers all required information for clips when using the `remove_segment` tool."""

    video_filepath: str = Field(description="Full path to target video file.")
    start: float = Field(description="""Start time of segment to be removed. Must be in the format of: seconds.milliseconds""")
    end: float = Field(description="""End time of segment to be removed. Must be in the format of: seconds.milliseconds""")


@tool("combine-clips", args_schema=CombineClipsInput)
async def combine_clips(clips: List[Clip], index_id: str) -> CombinedClip:
    """return a dict with the video_url and the metadata"""

    spaces = Spaces()

    # check if the combined clip already exists in the spaces
    combined_clip_ids: str = "".join([clip.clip_id for clip in clips])
    unique_hash = hashlib.sha256(combined_clip_ids.encode()).hexdigest()[-8:]
    combined_clip_filename = f"combined_{unique_hash}.mp4"
    combined_clip_exists = await spaces.check_clip_exists_in_spaces(
        os.environ.get("TWELVE_LABS_API_KEY"), combined_clip_filename, index_id, "combined_clips"
    )
    if combined_clip_exists:
        print(f"[DEBUG] Clip {combined_clip_filename} already exists in space.")
        video_url, clips_used = await spaces.get_file_url(os.environ.get("TWELVE_LABS_API_KEY"), index_id, combined_clip_filename, "combined_clips")
        return {"video_id": unique_hash, "video_url": video_url, "clips_used": clips_used}

    # let's craft the clips_used metadata
    clips_used: Dict[str, Clip] = {clip.clip_id: clip for clip in clips}
    metadata: CombinedClip = CombinedClip(video_id=unique_hash, video_url="", clips_used=clips_used)

    # otherwise, we need to combine the clips
    try:
        # Input validation first
        for clip in clips:
            if clip.start < 0:
                raise ValueError(f"Invalid start time: {clip.start}. Start time cannot be negative.")

        input_streams = []
        for clip in clips:
            video_id = clip.video_id
            start = clip.start
            end = clip.end
            video_filepath = os.path.join(
                os.environ["HOST_PUBLIC_DIR"], index_id, get_filename({"video_id": video_id, "start": start, "end": end})[0]
            )

            if not os.path.isfile(video_filepath):
                try:
                    download_video(video_id=video_id, index_id=index_id, start=start, end=end)
                except Exception as error:
                    print(f"[DEBUG] Error downloading video: {error}")
                    continue

            # attach metadata
            clip_video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").video
            clip_audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").audio
            clip_video_input_stream = clip_video_input_stream.filter("setpts", "PTS-STARTPTS")
            clip_audio_input_stream = clip_audio_input_stream.filter("asetpts", "PTS-STARTPTS")

            input_streams.extend([clip_video_input_stream, clip_audio_input_stream])

        # Create output filepath directly using HOST_PUBLIC_DIR and index_id
        output_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, combined_clip_filename)

        # local store
        ffmpeg.concat(*input_streams, v=1, a=1).output(
            output_filepath,
            vcodec="libx264",
            acodec="libmp3lame",
            video_bitrate="1M",
            audio_bitrate="192k",
            metadata=f"description={json.dumps(metadata.__json__())}",
        ).overwrite_output().run()

        # then upload the combined clip to the spaces
        await spaces.upload_file(os.environ.get("TWELVE_LABS_API_KEY"), combined_clip_filename, index_id, output_filepath, "combined_clips")

        # then grab the signed url from the spaces
        video_url, _ = await spaces.get_file_url(os.environ.get("TWELVE_LABS_API_KEY"), index_id, combined_clip_filename, "combined_clips")

        return {"video_id": unique_hash, "video_url": video_url, "clips_used": clips_used}

    except Exception as error:
        print(f"[DEBUG] Error combining clips: {error}")
        raise error˝


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
