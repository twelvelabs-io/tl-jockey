from pydantic import BaseModel, Field


class VideoSearchResult(BaseModel):
    video_id: str = Field(
        description="Video ID used to download a video. It is also used as the filename for the video.")
    score: float = Field(description="Score of the video.")
    start: float = Field(description="Start time of the clip.")
    end: float = Field(description="End time of the clip.")
    confidence: str = Field(description="Confidence of the clip.")
    video_url: str = Field(description="URL of the video.")
