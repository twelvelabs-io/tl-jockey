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
    try:
        input_streams = []
        aspect_ratios = []
        target_resolution = (1280, 720)

        print("\n--- Input Video Aspect Ratios ---")
        for i, clip in enumerate(clips, 1):
            video_id = clip.video_id
            start = clip.start
            end = clip.end
            video_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, f"{video_id}_{start}_{end}.mp4")

            if not os.path.isfile(video_filepath):
                try:
                    download_video(video_id=video_id, index_id=index_id, start=start, end=end)
                except AssertionError as error:
                    print(f"Error retrieving video metadata for Video ID: {video_id} in Index ID: {index_id}. "
                          "Check that the Video ID and Index ID are valid and correct.")
                    print(f"Error: {str(error)}")
                    continue  # Skip this clip and continue with others

            probe = ffmpeg.probe(video_filepath)
            video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
            
            if video_stream:
                width = int(video_stream.get('width', 0))
                height = int(video_stream.get('height', 0))
                sar = video_stream.get('sample_aspect_ratio', '1:1')
                dar = video_stream.get('display_aspect_ratio')
                
                if not dar and width and height:
                    dar = f"{width}:{height}"
                elif not dar:
                    dar = "16:9"

                if width == 0 or height == 0:
                    print(f"Warning: Invalid dimensions for clip {i} (Video ID: {video_id}). Skipping.")
                    continue

                aspect_ratio = width / height
                aspect_ratios.append(aspect_ratio)

                print(f"Clip {i}:")
                print(f"  Video ID: {video_id}")
                print(f"  Resolution: {width}x{height}")
                print(f"  Sample Aspect Ratio (SAR): {sar}")
                print(f"  Display Aspect Ratio (DAR): {dar}")
                print(f"  Calculated Aspect Ratio: {aspect_ratio:.2f}")
                print()
            else:
                print(f"Warning: Could not extract video stream information for clip {i} (Video ID: {video_id}). Skipping.")
                continue

            clip_video_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").video
            clip_audio_input_stream = ffmpeg.input(filename=video_filepath, loglevel="error").audio
            
            clip_video_input_stream = (
                clip_video_input_stream
                .filter('scale', target_resolution[0], target_resolution[1])
                .filter('setsar', '1/1')
                .filter("setpts", "PTS-STARTPTS")
            )
            clip_audio_input_stream = clip_audio_input_stream.filter("asetpts", "PTS-STARTPTS")
            
            input_streams.extend([clip_video_input_stream, clip_audio_input_stream])

        if not input_streams:
            return "Error: No valid clips to process."

        print("--- Aspect Ratio Analysis ---")
        if len(set([round(ar, 2) for ar in aspect_ratios])) > 1:
            print(f"Aspect ratios are different. Normalizing to {target_resolution[0]}x{target_resolution[1]}")
        else:
            print(f"All aspect ratios are the same, but still normalizing to {target_resolution[0]}x{target_resolution[1]}")

        output_filepath = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id, output_filename)
        print(f"\nCombining clips into: {output_filepath}")
        ffmpeg.concat(*input_streams, v=1, a=1).output(
            output_filepath, 
            vcodec="libx264",   
            acodec="libmp3lame", 
            video_bitrate="1M",
            audio_bitrate="192k"
        ).overwrite_output().run()

        print("Video combination completed successfully.")
        return output_filepath
    except Exception as error:
        print(f"Error during video combination: {str(error)}")
        return f"Error: {str(error)}"


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
