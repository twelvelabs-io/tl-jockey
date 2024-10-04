import os
import ffmpeg
from langchain.tools import tool
from langchain.pydantic_v1 import BaseModel, Field
from typing import List, Dict
from jockey.util import download_video
from jockey.prompts import DEFAULT_VIDEO_EDITING_FILE_PATH
from jockey.stirrups.stirrup import Stirrup


class Clip(BaseModel):
    """Define what constitutes a clip in the context of the video-editing worker."""
    index_id: str = Field(description="A UUID for the index a video belongs to. This is different from the video_id.")
    video_id: str = Field(description="A UUID for the video a clip belongs to.")
    start: float = Field(description="The start time of the clip in seconds.")
    end: float = Field(description="The end time of the clip in seconds.")


class CombineClipsInput(BaseModel):
    """Helps to ensure the video-editing worker providers all required information for clips when using the `combine_clips` tool."""
    clips: List[Clip] = Field(description="List of clips to be edited together. Each clip must have start and end times and a Video ID.")
    output_filename: str = Field(description="The output filename of the combined clips. Must be in the form: [filename].mp4")
    index_id: str = Field(description="Index ID the clips belong to.")


class RemoveSegmentInput(BaseModel):
    """Helps to ensure the video-editing worker providers all required information for clips when using the `remove_segment` tool."""
    video_filepath: str = Field(description="Full path to target video file.")
    start: float = Field(description="""Start time of segment to be removed. Must be in the format of: seconds.milliseconds""")
    end: float = Field(description="""End time of segment to be removed. Must be in the format of: seconds.milliseconds""")

def check_video_codecs(video_filepaths):
    codecs = set()
    for filepath in video_filepaths:
        probe = ffmpeg.probe(filepath)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        if video_stream:
            codecs.add(video_stream['codec_name'])
    return codecs

@tool("combine-clips", args_schema=CombineClipsInput)
def combine_clips(clips: List[Dict], output_filename: str, index_id: str) -> str:
    """Combine or edit multiple clips together based on their start and end times and video IDs. 
    The full filepath for the combined clips is returned."""
    try:
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
                        "error": str(error)
                    }
                    continue

            clip_video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").video
            clip_audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").audio
            clip_video_input_stream = clip_video_input_stream.filter("setpts", "PTS-STARTPTS")
            clip_audio_input_stream = clip_audio_input_stream.filter("asetpts", "PTS-STARTPTS")
            
            input_streams.extend([clip_video_input_stream, clip_audio_input_stream])

        output_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, output_filename)
        codecs = check_video_codecs(video_filepaths)

        if len(codecs) > 1 or 'h264' not in codecs:
            ffmpeg.concat(*input_streams, v=1, a=1).output(
                output_filepath, 
                vcodec="libx264",   
                acodec="libmp3lame", 
                video_bitrate="1M",
                audio_bitrate="192k"
            ).overwrite_output().run()
        else:
            ffmpeg.concat(*input_streams, v=1, a=1).output(
                output_filepath, 
                acodec="libmp3lame"
            ).overwrite_output().run(capture_stdout=True, capture_stderr=True)

        return output_filepath
    except Exception as error:
        print(error)
        error_response = {
            "message": "There was a video editing error.",
            "error": str(error)
        }
        return error_response


@tool("remove-segment", args_schema=RemoveSegmentInput)
def remove_segment(video_filepath: str, start: float, end: float) -> str:
    """Remove a segment from a video at specified start and end times. The full filepath for the edited video is returned."""
    output_filepath = f"{os.path.splitext(video_filepath)[0]}_clipped.mp4"

    left_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=0, end=start).filter("setpts", "PTS-STARTPTS")
    left_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=0, end=start).filter("asetpts", "PTS-STARTPTS")
    right_cut_video_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").video.filter("trim", start=end).filter("setpts", "PTS-STARTPTS")
    right_cut_audio_stream = ffmpeg.input(filename=video_filepath, loglevel="quiet").audio.filter("atrim", start=end).filter("asetpts", "PTS-STARTPTS")

    streams = [left_cut_video_stream, left_cut_audio_stream, right_cut_video_stream, right_cut_audio_stream]

    ffmpeg.concat(*streams, v=1, a=1).output(filename=output_filepath, acodec="libmp3lame").overwrite_output().run()

    return output_filepath


# Construct a valid worker for a Jockey instance.
video_editing_worker_config = {
    "tools": [combine_clips, remove_segment],
    "worker_prompt_file_path": DEFAULT_VIDEO_EDITING_FILE_PATH,
    "worker_name": "video-editing"
}
VideoEditingWorker = Stirrup(**video_editing_worker_config)
