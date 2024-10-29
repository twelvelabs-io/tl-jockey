from enum import Enum
from pydantic import BaseModel
from typing import Optional


class NodeType(str, Enum):
    """High-level nodes where errors can occur"""

    PLANNER = "planner"
    SUPERVISOR = "supervisor"
    WORKER = "worker"
    INSTRUCTOR = "instructor"
    REFLECT = "reflect"


class WorkerFunction(str, Enum):
    """Specific functions within the worker node"""

    VIDEO_SEARCH = "video_search"
    VIDEO_EDITING = "video_editing"
    VIDEO_TEXT_GENERATION = "video_text_generation"
    REMOVE_SEGMENT = "remove_segment"
    COMBINE_CLIPS = "combine_clips"
    DOWNLOAD_VIDEO = "download_video"
    GIST_TEXT_GENERATION = "gist_text_generation"
    SUMMARIZE_TEXT_GENERATION = "summarize_text_generation"
    FREE_TEXT_GENERATION = "free_text_generation"


class ErrorType(str, Enum):
    """Categories of errors that can occur"""

    VIDEO = "VIDEO"
    SEARCH = "SEARCH"
    TEXT = "TEXT"
    API = "API"
    METADATA = "METADATA"
    VALIDATION = "VALIDATION"
    INSTRUCTION = "INSTRUCTION"
    PLANNING = "PLANNING"
    TEXT_GENERATION = "text_generation"
    UNEXPECTED = "UNEXPECTED"


class JockeyErrorData(BaseModel):
    """Data class for error details"""

    node: NodeType
    error_type: ErrorType
    function_name: Optional[WorkerFunction] = None
    details: Optional[str] = None

    @property
    def error_message(self) -> str:
        base_msg = f"{self.error_type.value} error in {self.node.value} node"
        if self.function_name:
            base_msg += f" ({self.function_name.value})"
        return f"{base_msg}: {self.details}" if self.details else base_msg


# this needs to be decoupled because we can't inherit both JockeyError(Exception, BaseModel)
class JockeyError(Exception):
    """Custom exception class"""

    def __init__(self, error_data: JockeyErrorData):
        super().__init__(error_data.error_message)
        self.error_data = error_data

    @classmethod
    def create(cls, node: NodeType, error_type: ErrorType, function_name: Optional[WorkerFunction] = None, details: Optional[str] = None):
        error_data = JockeyErrorData(node=node, error_type=error_type, function_name=function_name, details=details)
        return cls(error_data)


# Example usage:

# try:
#     # Worker node video editing failure
#     raise ValueError("Invalid timestamp")
# except Exception as e:
#     error = JockeyError.create(node=NodeType.WORKER, error_type=ErrorType.VIDEO, function_name=WorkerFunction.VIDEO_EDITING, details=str(e))
#     # error.error_message would return:
#     # "VIDEO error in worker node (video_editing): Invalid timestamp"

# # Example of planner node error
# try:
#     # Planner node failure
#     raise Exception("Failed to generate plan")
# except Exception as e:
#     error = JockeyError.create(node=NodeType.PLANNER, error_type=ErrorType.PLANNING, details=str(e))
#     # error.error_message would return:
#     # "PLANNING error in planner node: Failed to generate plan"
