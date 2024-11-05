from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict, Any
from langgraph.errors import (
    GraphRecursionError,
    InvalidUpdateError,
    EmptyInputError,
    TaskNotFound,
    CheckpointNotLatest,
    MultipleSubgraphsError,
    GraphInterrupt,
    NodeInterrupt,
    GraphDelegate,
)


def get_langgraph_errors():
    return (
        GraphRecursionError,
        InvalidUpdateError,
        GraphInterrupt,
        NodeInterrupt,
        GraphDelegate,
        EmptyInputError,
        TaskNotFound,
        CheckpointNotLatest,
        MultipleSubgraphsError,
    )


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
    FREEFORM_TEXT_GENERATION = "freeform_text_generation"


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


def create_interrupt_event(run_id: str | None = None, last_event: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create an interrupt event dictionary matching LangChain's event structure."""
    return {
        "event": "on_interrupt",
        "name": "JockeyInterrupt",
        "run_id": str(run_id),
        "data": {
            "message": "Stream interrupted by user",
            "last_event": last_event,
            "event_type": last_event.get("event") if last_event else None,
            "node": last_event.get("metadata", {}).get("langgraph_node") if last_event else None,
        },
        "tags": last_event.get("tags", []) if last_event else [],
        "metadata": {
            "interrupted_at": last_event.get("metadata", {}) if last_event else {},
        },
    }


def create_langgraph_error_event(run_id: str | None = None, last_event: Dict[str, Any] = None, error: Exception = None) -> Dict[str, Any]:
    """Create an interrupt event dictionary matching LangChain's event structure."""
    return {
        "event": "on_error",
        "name": f"LangGraphError::{error.__class__.__name__ if error else 'Unknown'}",  # Changed to :: separator and fixed error name
        "run_id": str(run_id),
        "data": {
            "message": "LangGraph error occurred",
            "last_event": last_event,
            "event_type": last_event.get("event") if last_event else None,
            "node": last_event.get("metadata", {}).get("langgraph_node") if last_event else None,
        },
        "tags": last_event.get("tags", []) if last_event else [],
        "metadata": {
            "error_at": last_event.get("metadata", {}) if last_event else {},
        },
    }


def create_jockey_error_event(run_id: str | None = None, last_event: Dict[str, Any] = None, error: JockeyError = None) -> Dict[str, Any]:
    """Create a Jockey error event dictionary matching LangChain's event structure."""
    return {
        "event": "on_error",
        "name": f"JockeyError::{error.error_data.error_type.value if error else 'Unknown'}",
        "run_id": str(run_id),
        "data": {
            "message": str(error) if error else "Jockey error occurred",
            "last_event": last_event,
            "event_type": last_event.get("event") if last_event else None,
            "node": last_event.get("metadata", {}).get("langgraph_node") if last_event else None,
            "error_details": {
                "node": error.error_data.node.value if error else None,
                "error_type": error.error_data.error_type.value if error else None,
                "function_name": error.error_data.function_name.value if error and error.error_data.function_name else None,
                "details": error.error_data.details if error else None,
                "error_message": error.error_data.error_message if error else None,
            },
        },
        "tags": last_event.get("tags", []) if last_event else [],
        "metadata": {
            "error_at": last_event.get("metadata", {}) if last_event else {},
        },
    }


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
