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


@tool("combine-clips", args_schema=CombineClipsInput)
def combine_clips(clips: List[Dict], output_filename: str, index_id: str) -> str:
    input_streams = []
    output_dir = os.path.join(os.environ.get("HOST_PUBLIC_DIR", ""))
    
    for clip in clips:
        video_id = clip.video_id
        start = clip.start
        end = clip.end
        video_filepath = os.path.join(output_dir, index_id, f"{video_id}_{start}_{end}.mp4")
        
        if not os.path.isfile(video_filepath):
            download_video(video_id=video_id, index_id=index_id, start=start, end=end)
        

        print(f"Processing clip: {video_filepath}")
        

        video_stream = ffmpeg.input(video_filepath).video.filter("setpts", "PTS-STARTPTS")
        audio_stream = ffmpeg.input(video_filepath).audio.filter("asetpts", "PTS-STARTPTS")
        input_streams.extend([video_stream, audio_stream])
    
    output_filepath = os.path.join(output_dir, index_id, output_filename)
    
    try:
            print(f"Started ffmpge")
            ffmpeg.concat(*input_streams, v=1, a=1).output(
                output_filepath,
                vcodec="libx264",
                acodec="aac",
            ).overwrite_output().run(capture_stderr=True)
            print(f"Finished ffmpge")
            if os.path.exists(output_filepath) and os.path.getsize(output_filepath) > 0:
                result_url = f"https://spooky.videos.ngrok.app/{index_id}/{output_filename}"
                print(f"Successfully created: {result_url}")
                return result_url
            else:
                    raise ValueError("Output file is empty or does not exist")
            # return f"https://spooky.videos.ngrok.app/{index_id}/{output_filename}"
        
    except ffmpeg.Error as e:
        print("FFmpeg error occurred:")
        print(e.stderr.decode())
        return {
            "message": "FFmpeg encoding error",
            "error": e.stderr.decode()
        }


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

