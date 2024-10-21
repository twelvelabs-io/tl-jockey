import pytest
from unittest.mock import patch, MagicMock
import ffmpeg

# testing stirrups/video_editing.py
from jockey.stirrups.video_editing import combine_clips, remove_segment, Clip, CombineClipsInput, RemoveSegmentInput
from jockey.stirrups.errors import TwelveLabsErrorType, ErrorState


@pytest.fixture
def mock_environment(monkeypatch):
    """setup mock environment variables for testing"""
    monkeypatch.setenv("HOST_PUBLIC_DIR", "/mock/public/dir")


@pytest.mark.asyncio
@patch("jockey.stirrups.video_editing.ffmpeg")
@patch("jockey.stirrups.video_editing.download_video")
async def test_combine_clips_success(mock_download, mock_ffmpeg, mock_environment):
    # Arrange
    clips = [Clip(index_id="index1", video_id="video1", start=0, end=10), Clip(index_id="index1", video_id="video2", start=5, end=15)]
    input_data = CombineClipsInput(clips=clips, output_filename="combined.mp4", index_id="index1")

    # must be converted to dict(). see https://api.python.langchain.com/en/latest/chains/langchain.chains.llm.LLMChain.html#langchain.chains.llm.LLMChain.ainvoke
    input_dict = input_data.dict()

    mock_ffmpeg.input.return_value.video = MagicMock()
    mock_ffmpeg.input.return_value.audio = MagicMock()
    mock_ffmpeg.concat.return_value.output.return_value.overwrite_output.return_value.run.return_value = None

    # call the tool, remember that input must be a dict
    result = await combine_clips.ainvoke(input=input_dict, config={"tags": ["video-editing"]})

    # Assert
    assert result == "/mock/public/dir/index1/combined.mp4"
    assert mock_download.call_count == 2  # because we have two clips
    assert mock_ffmpeg.concat.called
    assert mock_ffmpeg.concat.return_value.output.called


@pytest.mark.asyncio
@patch("jockey.stirrups.video_editing.ffmpeg")
@patch("jockey.stirrups.video_editing.download_video")
async def test_combine_clips_download_error(mock_download, mock_ffmpeg, mock_environment):
    # Arrange
    clips = [Clip(index_id="index1", video_id="video1", start=0, end=10)]
    input_data = CombineClipsInput(clips=clips, output_filename="combined.mp4", index_id="index1")

    mock_download.side_effect = AssertionError("Download failed")

    # must be converted to dict(). see https://api.python.langchain.com/en/latest/chains/langchain.chains.llm.LLMChain.html#langchain.chains.llm.LLMChain.ainvoke
    input_dict = input_data.dict()

    # Act
    result = await combine_clips.ainvoke(input=input_dict, config={"tags": ["video-editing"]})

    # Assert
    assert isinstance(result, dict)
    assert result["error_type"] == TwelveLabsErrorType.RETRIEVE_VIDEO_METADATA.value
    assert result["error_state"] == ErrorState.VIDEO_EDITING_ERROR.value
    assert "There was an error retrieving the video metadata" in result["error_message"]


# @patch("jockey.stirrups.video_editing.ffmpeg")
# def test_remove_segment_success(mock_ffmpeg, mock_environment):
#     # Arrange
#     input_data = RemoveSegmentInput(video_filepath="/mock/public/dir/test_video.mp4", start=5.0, end=10.0)

#     mock_ffmpeg.input.return_value.video.filter.return_value.filter.return_value = MagicMock()
#     mock_ffmpeg.input.return_value.audio.filter.return_value.filter.return_value = MagicMock()
#     mock_ffmpeg.concat.return_value.output.return_value.overwrite_output.return_value.run.return_value = None

#     # Act
#     result = remove_segment(input_data)

#     # Assert
#     assert result == "/mock/public/dir/test_video_clipped.mp4"
#     assert mock_ffmpeg.concat.called
#     assert mock_ffmpeg.concat.return_value.output.called


# @patch("jockey.stirrups.video_editing.ffmpeg")
# def test_remove_segment_ffmpeg_error(mock_ffmpeg, mock_environment):
#     # Arrange
#     input_data = RemoveSegmentInput(video_filepath="/mock/public/dir/test_video.mp4", start=5.0, end=10.0)

#     mock_ffmpeg.input.side_effect = ffmpeg.Error("FFmpeg error", "", "")

#     # Act
#     result = remove_segment(input_data)

#     # Assert
#     assert isinstance(result, dict)
#     assert result["error_type"] == TwelveLabsErrorType.REMOVE_SEGMENT.value
#     assert result["error_state"] == ErrorState.VIDEO_EDITING_ERROR.value
#     assert "FFmpeg error" in result["error_message"]


# Add more tests as needed for edge cases and error scenarios
