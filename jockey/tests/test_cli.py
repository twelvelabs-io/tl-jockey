import pytest
from unittest.mock import AsyncMock, patch, MagicMock, call
from jockey.cli import run_jockey_terminal
from jockey.util import get_langgraph_errors
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
from rich.console import Console
from jockey.stirrups.errors import JockeyError, ErrorType, NodeType, WorkerFunction
from langchain_core.messages import HumanMessage
from jockey.__main__ import main


# List of all LangGraph errors and their corresponding user inputs
LANGGRAPH_ERROR_CASES = [
    ("Graph Recursion Error", GraphRecursionError, "Test Graph Recursion Error"),
    ("Invalid Update Error", InvalidUpdateError, "Test Invalid Update Error"),
    ("Empty Input Error", EmptyInputError, "Test Empty Input Error"),
    ("Task Not Found", TaskNotFound, "Test Task Not Found Error"),
    ("Checkpoint Not Latest", CheckpointNotLatest, "Test Checkpoint Not Latest Error"),
    ("Multiple Subgraphs Error", MultipleSubgraphsError, "Test Multiple Subgraphs Error"),
    ("Graph Interrupt", GraphInterrupt, "Test Graph Interrupt Error"),
    ("Graph Delegate", GraphDelegate, "Test Graph Delegate Error"),
    # Todo fix NodeInterrupt
    # ("Node Interrupt", NodeInterrupt(value="test"), [Interrupt("Test Node Interrupt Error")]),
]


@pytest.fixture
def mock_console():
    with patch("jockey.cli.Console") as mock:
        console = mock.return_value
        yield console


@pytest.fixture
def mock_jockey():
    with patch("jockey.cli.jockey") as mock:
        yield mock


@pytest.fixture
def mock_get_langgraph_errors():
    with patch("jockey.cli.get_langgraph_errors") as mock:
        yield mock


@pytest.mark.asyncio
@pytest.mark.parametrize("user_input,error_class,error_message", LANGGRAPH_ERROR_CASES)
async def test_run_jockey_terminal_langgraph_errors(mock_console, mock_jockey, mock_get_langgraph_errors, user_input, error_class, error_message):
    # Arrange
    mock_console.input.side_effect = [user_input, error_class]
    mock_get_langgraph_errors.return_value = error_class

    if user_input == "Node Interrupt":
        mock_jockey.astream_events.side_effect = (
            NodeInterrupt("Test Node Interrupt Error") if error_class == NodeInterrupt else error_class(error_message)
        )
    else:
        mock_jockey.astream_events.side_effect = error_class(error_message)

    # Act & Assert
    with pytest.raises(error_class):
        await run_jockey_terminal()

    # Verify interactions
    assert mock_console.input.call_count == 2
    mock_console.print.assert_any_call(f"[red]LangGraph Error occurred: {error_message}[/red]")
    mock_jockey.astream_events.assert_called_once()

    # Verify chat history
    expected_error_message = HumanMessage(content=f"LangGraph Error occurred: {error_message}", name="error")
    actual_chat_history = mock_jockey.astream_events.call_args[0][0]["chat_history"]
    assert actual_chat_history[-1].content == expected_error_message.content
    assert actual_chat_history[-1].name == expected_error_message.name

    assert mock_console.print.call_args_list == [
        call(),
        call(f"[red]LangGraph Error occurred: {error_message}[/red]"),
        call(),
        call(),
    ]

    # this proves that the input is called twice, once for the initial prompt and once after the error
    assert mock_console.mock_calls == [
        call.print(),
        call.input("[green]👤 Chat: "),
        call.print(f"[red]LangGraph Error occurred: {error_message}[/red]"),
        call.print(),
        call.print(),
        call.input("[green]👤 Chat: "),
    ]

    # Todo: another assert to check that the error message is in the chat history or state

    # print(mock_console.mock_calls)
    # print(mock_console.input.call_args_list)
    # print(f"Console calls: {mock_console.print.call_args_list}")
    # print(f"Jockey calls: {mock_jockey.astream_events.call_args_list}")
