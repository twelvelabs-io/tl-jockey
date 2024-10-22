from enum import Enum
from pydantic import BaseModel
from typing import Optional


class NodeType(str, Enum):
    """High-level nodes where errors can occur"""

    PLANNER = "planner"
    SUPERVISOR = "supervisor"
    WORKER = "worker"
    REFLECT = "reflect"


class WorkerFunction(str, Enum):
    """Specific functions within the worker node"""

    VIDEO_SEARCH = "video_search"
    VIDEO_EDITING = "video_editing"
    VIDEO_TEXT_GENERATION = "video_text_generation"


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
    UNEXPECTED = "UNEXPECTED"


class JockeyError(BaseModel):
    node: NodeType
    error_type: ErrorType
    function_name: Optional[WorkerFunction] = None  # Only needed for worker node errors
    details: Optional[str] = None

    @property
    def error_message(self) -> str:
        if self.node == NodeType.WORKER and self.function_name:
            base_msg = f"{self.error_type.value} error in {self.node.value} node ({self.function_name.value})"
        else:
            base_msg = f"{self.error_type.value} error in {self.node.value} node"

        if self.details:
            return f"{base_msg}: {self.details}"
        return base_msg

    @classmethod
    def create(cls, node: NodeType, error_type: ErrorType, function_name: Optional[WorkerFunction] = None, details: Optional[str] = None):
        return cls(node=node, error_type=error_type, function_name=function_name, details=details)


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
