from pydantic import BaseModel
from enum import Enum


class TwelveLabsErrorType(str, Enum):
    COMBINE_CLIPS = "combine-clips"
    REMOVE_SEGMENT = "remove-segment"
    SIMPLE_VIDEO_SEARCH = "simple-video-search"
    GIST_TEXT_GENERATION = "gist-text-generation"
    SUMMARIZE_TEXT_GENERATION = "summarize-text-generation"
    FREEFORM_TEXT_GENERATION = "freeform-text-generation"
    RETRIEVE_VIDEO_METADATA = "retrieve-video-metadata"


class ErrorState(str, Enum):
    TOOL_FAILURE = "TOOL_FAILURE"
    VIDEO_EDITING_ERROR = "VIDEO_EDITING_ERROR"
    SEARCH_ERROR = "SEARCH_ERROR"
    TEXT_GENERATION_ERROR = "TEXT_GENERATION_ERROR"
    API_ERROR = "API_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    RETRIEVE_VIDEO_METADATA = "RETRIEVE_VIDEO_METADATA"


class ErrorMessages(str, Enum):
    COMBINE_CLIPS = "There was a video editing error: {error}"
    REMOVE_SEGMENT = "There was a video editing error: {error}"
    SIMPLE_VIDEO_SEARCH = "There was a video search error: {error}"
    GIST_TEXT_GENERATION = "There was a text generation error: {error}"
    SUMMARIZE_TEXT_GENERATION = "There was a text generation error: {error}"
    FREEFORM_TEXT_GENERATION = "There was a text generation error: {error}"
    RETRIEVE_VIDEO_METADATA = "There was an error retrieving the video metadata: {error}"

class TwelveLabsError(BaseModel):
    error_type: TwelveLabsErrorType
    error_state: ErrorState
    error_message: str

    @classmethod
    def create(cls, error_type: TwelveLabsErrorType, error_state: ErrorState, error: str):
        error_message = ErrorMessages[error_type.name].value.format(error=error)
        return cls(error_type=error_type, error_state=error_state, error_message=error_message)
