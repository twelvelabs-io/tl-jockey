import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from langchain_core.messages import AIMessage
from langgraph.errors import EmptyInputError
from langchain.tools import BaseTool
from jockey.stirrups.stirrup import Stirrup
from jockey.util import create_langgraph_error_event, create_jockey_error_event
from jockey.stirrups.errors import JockeyError, ErrorType, NodeType
import langgraph.errors
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage
import os
from jockey.stirrups.errors import JockeyErrorData, JockeyError
from unittest.mock import call
from jockey.cli import run_jockey_terminal

PROMPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prompts"))
VIDEO_SEARCH_PROMPT = os.path.join(PROMPTS_DIR, "video_search.md")

with open(VIDEO_SEARCH_PROMPT, "r") as f:
    VIDEO_SEARCH_PROMPT_CONTENT = f.read()


@pytest.fixture
def mock_jockey():
    with patch("jockey.cli.jockey") as mock:
        yield mock


@pytest.fixture
def mock_console():
    with patch("jockey.cli.Console") as mock:
        console = mock.return_value
        yield console


@pytest.fixture
def mock_get_langgraph_errors():
    with patch("jockey.cli.get_langgraph_errors") as mock:
        yield mock


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
async def test_toolcall_jockey_error(stirrup, mock_tool, mock_console):
    # Arrange
    stirrup.tools = [mock_tool]
    message = AIMessage(
        content="Test message", tool_calls=[{"name": "test_tool", "args": {"input": "test_args"}, "id": "call_01", "type": "function"}]
    )

    error_data = JockeyErrorData(error_type=ErrorType.SEARCH, node=NodeType.WORKER, message="Invalid input provided")
    error = JockeyError(error_data)
    mock_tool.ainvoke.side_effect = error

    mock_event = create_jockey_error_event("test", {}, error)

    with patch("jockey.stirrups.stirrup.create_jockey_error_event") as mock_create_event, patch(
        "jockey.stirrups.stirrup.parse_langchain_events_terminal"
    ) as mock_parse_events:
        mock_create_event.return_value = mock_event

        # Act & Assert
        with pytest.raises(JockeyError) as exc_info:
            await stirrup._call_tools(message)

        # Verify error handling
        mock_tool.ainvoke.assert_called_once_with({"input": "test_args"})
        mock_create_event.assert_called_once()
        mock_parse_events.assert_called_once_with(mock_event)

        # Verify the error is raised with correct data
        assert str(exc_info.value) == str(error)
        print("exc_info.value", exc_info.value)
        assert "SEARCH" in str(exc_info.value)
        assert "worker" in str(exc_info.value)


@pytest.mark.asyncio
async def test_toolcall_langgraph_error(stirrup, mock_tool, mock_console):
    # Arrange
    stirrup.tools = [mock_tool]
    message = AIMessage(
        content="Test message", tool_calls=[{"name": "test_tool", "args": {"input": "test_args"}, "id": "call_01", "type": "function"}]
    )

    error = langgraph.errors.EmptyInputError("Empty input provided")
    mock_tool.ainvoke.side_effect = error

    mock_event = create_langgraph_error_event("test", {}, EmptyInputError("Empty input provided"))

    with patch("jockey.stirrups.stirrup.create_langgraph_error_event") as mock_create_event, patch(
        "jockey.stirrups.stirrup.parse_langchain_events_terminal"
    ) as mock_parse_events:
        mock_create_event.return_value = mock_event

        # Act & Assert
        with pytest.raises(EmptyInputError) as exc_info:
            await stirrup._call_tools(message)

        # Verify error handling
        mock_tool.ainvoke.assert_called_once_with({"input": "test_args"})
        mock_create_event.assert_called_once()
        mock_parse_events.assert_called_once_with(mock_event)

        # Verify the error is raised with correct data
        assert str(exc_info.value) == str(error)
        print("exc_info.value", exc_info.value)


# @pytest.mark.asyncio
# async def test_build_worker_langgraph_error(stirrup):
#     # Arrange
#     error_message = "Graph build error"
#     error = EmptyInputError(error_message)
#     mock_llm = AsyncMock(spec=AzureChatOpenAI)

#     # Setup the chain construction to fail
#     mock_chain = MagicMock()
#     mock_chain.__or__ = MagicMock(side_effect=error)

#     def mock_bind_tools(*args, **kwargs):
#         return mock_chain

#     mock_llm.bind_tools = mock_bind_tools

#     mock_event = create_langgraph_error_event("test", {}, error)

#     with patch("jockey.stirrups.stirrup.create_langgraph_error_event") as mock_create_event, patch(
#         "jockey.stirrups.stirrup.parse_langchain_events_terminal", new_callable=AsyncMock
#     ) as mock_parse_events, patch("jockey.stirrups.stirrup.get_langgraph_errors") as mock_get_errors, patch(
#         "jockey.stirrups.stirrup.ChatPromptTemplate"
#     ) as mock_prompt:
#         # Setup get_langgraph_errors to return a tuple of error types
#         mock_get_errors.return_value = (EmptyInputError,)
#         mock_create_event.return_value = mock_event
#         mock_prompt.from_messages.return_value = MagicMock()
#         mock_prompt.from_messages.return_value.__or__ = MagicMock(return_value=mock_chain)

#         # Act & Assert
#         with pytest.raises(EmptyInputError) as exc_info:
#             await stirrup.build_worker(mock_llm)

#         # Verify the error
#         assert str(exc_info.value) == error_message

#         # Verify event creation and parsing
#         mock_create_event.assert_called_once_with()
#         mock_parse_events.assert_awaited_once_with(mock_event)


# @pytest.mark.asyncio
# async def test_build_worker_jockey_error(stirrup):
#     # Arrange
#     error_data = JockeyErrorData(error_type=ErrorType.SEARCH, node=NodeType.WORKER, message="Worker build failed")
#     error = JockeyError(error_data)
#     mock_llm = AsyncMock(spec=AzureChatOpenAI)

#     # Setup the chain construction to fail
#     mock_chain = MagicMock()
#     mock_chain.__or__ = MagicMock(side_effect=error)

#     def mock_bind_tools(*args, **kwargs):
#         return mock_chain

#     mock_llm.bind_tools = mock_bind_tools

#     mock_event = create_jockey_error_event("test", {}, error)

#     with patch("jockey.stirrups.stirrup.create_jockey_error_event") as mock_create_event, patch(
#         "jockey.stirrups.stirrup.parse_langchain_events_terminal"
#     ) as mock_parse_events, patch("jockey.stirrups.stirrup.ChatPromptTemplate") as mock_prompt:
#         mock_create_event.return_value = mock_event
#         mock_prompt.from_messages.return_value = MagicMock()
#         mock_prompt.from_messages.return_value.__or__ = MagicMock(return_value=mock_chain)

#         # Act & Assert
#         with pytest.raises(JockeyError) as exc_info:
#             stirrup.build_worker(mock_llm)

#         # Verify the error
#         assert str(exc_info.value) == str(error)
#         assert "SEARCH" in str(exc_info.value)
#         assert "worker" in str(exc_info.value)

#         # Verify event creation and parsing
#         mock_create_event.assert_called_once_with()
#         mock_parse_events.assert_called_once_with(mock_event)


# @pytest.mark.asyncio
# async def test_build_worker_type_error(stirrup):
#     # Arrange
#     class UnsupportedLLM:
#         pass

#     mock_llm = UnsupportedLLM()

#     # Act & Assert
#     with pytest.raises(TypeError) as exc_info:
#         stirrup.build_worker(mock_llm)

#     # Verify the error message
#     expected_error = f"LLM type must be one of: [ChatOpenAI, AzureChatOpenAI]. Got type: {UnsupportedLLM.__name__}."
#     assert str(exc_info.value) == expected_error
