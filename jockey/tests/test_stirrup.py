import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from langchain_core.messages import AIMessage
from langgraph.errors import GraphRecursionError
from langchain.tools import BaseTool
from jockey.stirrups.stirrup import Stirrup
from jockey.util import create_langgraph_error_event, create_jockey_error_event
from jockey.stirrups.errors import JockeyError, ErrorType, NodeType
import langgraph.errors
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage
import os
from jockey.stirrups.errors import JockeyErrorData, JockeyError

PROMPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prompts"))
VIDEO_SEARCH_PROMPT = os.path.join(PROMPTS_DIR, "video_search.md")

with open(VIDEO_SEARCH_PROMPT, "r") as f:
    VIDEO_SEARCH_PROMPT_CONTENT = f.read()


@pytest.fixture
def mock_tool():
    tool = MagicMock(spec=BaseTool)
    tool.name = "test_tool"
    tool.ainvoke = AsyncMock()
    return tool


@pytest.fixture
def stirrup():
    return Stirrup(tools=[], worker_prompt_file_path=VIDEO_SEARCH_PROMPT, worker_name="test_worker")


@pytest.mark.asyncio
async def test_call_tools_graph_recursion_error(stirrup, mock_tool):
    # Arrange
    stirrup.tools = [mock_tool]
    message = AIMessage(
        content="Test message", tool_calls=[{"name": "test_tool", "args": {"input": "test_args"}, "id": "call_01", "type": "function"}]
    )

    error_message = "Maximum recursion depth exceeded"
    error = GraphRecursionError(error_message)  # Create actual error instance
    mock_tool.ainvoke.side_effect = error

    # Create a mock event that matches the expected format
    mock_event = create_langgraph_error_event("test", {}, error)  # Pass error instance, not message

    with patch("jockey.stirrups.stirrup.create_langgraph_error_event") as mock_create_event:
        mock_create_event.return_value = mock_event

        # Act
        tool_calls = await stirrup._call_tools(message)

        # Assert
        assert len(tool_calls) == 1
        assert tool_calls[0]["name"] == "test_tool"
        assert tool_calls[0]["output"] == f"{error.__class__.__name__}: {str(error)}"
        assert create_langgraph_error_event("test", {}, error) == mock_event
        mock_tool.ainvoke.assert_called_once_with({"input": "test_args"})


@pytest.mark.asyncio
async def test_call_jockey_error(stirrup, mock_tool):
    # Arrange
    stirrup.tools = [mock_tool]
    message = AIMessage(
        content="Test message", tool_calls=[{"name": "test_tool", "args": {"input": "test_args"}, "id": "call_01", "type": "function"}]
    )

    error_data = JockeyErrorData(error_type=ErrorType.SEARCH, node=NodeType.WORKER, message="Invalid input provided")
    error = JockeyError(error_data)
    mock_tool.ainvoke.side_effect = error

    mock_event = create_jockey_error_event("test", {}, error)

    with patch("jockey.stirrups.stirrup.create_jockey_error_event") as mock_create_event:
        mock_create_event.return_value = mock_event

        # Act
        tool_calls = await stirrup._call_tools(message)

        # Assert
        assert len(tool_calls) == 1
        assert tool_calls[0]["name"] == "test_tool"
        assert tool_calls[0]["output"] == f"{error.__class__.__name__}: {str(error)}"
        mock_tool.ainvoke.assert_called_once_with({"input": "test_args"})
