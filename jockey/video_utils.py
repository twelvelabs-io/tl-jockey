import os
import requests
import ffmpeg
import urllib.parse

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urllib.parse.urljoin(TL_BASE_URL, "indexes/")


def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"

    headers = {"accept": "application/json", "Content-Type": "application/json", "x-api-key": os.environ["TWELVE_LABS_API_KEY"]}

    response = requests.get(video_url, headers=headers)

    try:
        assert response.status_code == 200
    except AssertionError:
        error_response = {
            "message": f"There was an error getting the metadata for Video ID: {video_id} in Index ID: {index_id}. "
            "Double check that the Video ID and Index ID are valid and correct.",
            "error": response.text,
        }
        return error_response

    return response


def download_video(video_id: str, index_id: str, start: float, end: float) -> str:
    """Download a video for a given video in a given index and get the filepath.
    Should only be used when the user explicitly requests video editing functionalities."""
    headers = {"x-api-key": os.environ["TWELVE_LABS_API_KEY"], "accept": "application/json", "Content-Type": "application/json"}

    video_url = f"https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id}"

    response = requests.get(video_url, headers=headers)

    assert response.status_code == 200

    hls_uri = response.json()["hls"]["video_url"]

    video_dir = os.path.join(os.environ["HOST_PUBLIC_DIR"], index_id)

    if os.path.isdir(video_dir) is False:
        os.mkdir(video_dir)

    video_filename = f"{video_id}_{start}_{end}.mp4"
    video_path = os.path.join(video_dir, video_filename)

    if os.path.isfile(video_path) is False:
        try:
            duration = end - start
            buffer = 1  # Add a 1-second buffer on each side
            ffmpeg.input(filename=hls_uri, strict="experimental", loglevel="quiet", ss=max(0, start - buffer), t=duration + 2 * buffer).output(
                video_path, vcodec="libx264", acodec="aac", avoid_negative_ts="make_zero", fflags="+genpts"
            ).run()

            # Then trim the video more precisely
            output_trimmed = f"{os.path.splitext(video_path)[0]}_trimmed.mp4"
            ffmpeg.input(video_path, ss=buffer, t=duration).output(output_trimmed, vcodec="copy", acodec="copy").run()

            # Replace the original file with the trimmed version
            os.replace(output_trimmed, video_path)
        except Exception as error:
            error_response = {
                "message": f"There was an error downloading the video with Video ID: {video_id} in Index ID: {index_id}. "
                "Double check that the Video ID and Index ID are valid and correct.",
                "error": str(error),
            }
            return error_response

    return video_path
