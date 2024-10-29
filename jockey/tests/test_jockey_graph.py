# import pytest
# from unittest.mock import patch, MagicMock, AsyncMock
# from langchain_core.messages import HumanMessage
# # from jockey.stirrups.errors import TwelveLabsError, ErrorState, ErrorType
# from jockey.jockey_graph import Jockey, jockey_graph


# @pytest.mark.asyncio
# @patch("jockey.jockey_graph.VideoSearchWorker")
# @patch("jockey.jockey_graph.VideoTextGenerationWorker")
# @patch("jockey.jockey_graph.VideoEditingWorker")
# async def test_worker_node_successful_execution(mock_video_editing, mock_video_text_gen, mock_video_search):
#     """Test successful execution of a worker node with proper dependency patches."""
#     # Arrange
#     state = {"next_worker": "video_search", "chat_history": [], "active_plan": "Test plan"}

#     mock_jockey = MagicMock(spec=Jockey)
#     mock_jockey.worker_instructor = AsyncMock()
#     mock_jockey.worker_instructor.ainvoke.retun_value = HumanMessage(content="Test instruction", name="instructor")

#     mock_worker = AsyncMock()
#     mock_worker.ainvoke.return_value = {"result": "success"}
#     mock_worker.name = "video_search"

#     # Act
#     result = await Jockey._worker_node(mock_jockey, state, mock_worker)

#     # Assert
#     mock_jockey.worker_instructor.ainvoke.assert_called_once_with(state)
#     mock_worker.ainvoke.assert_called_once_with({"worker_task": [mock_jockey.worker_instructor.ainvoke.return_value]})
#     assert len(result["chat_history"]) == 2
#     assert result["chat_history"][0].name == "instructor"
#     assert result["chat_history"][0].content == "Test instruction"
#     assert result["chat_history"][1].name == "video_search"
#     assert '"result": "success"' in result["chat_history"][1].content


# # @pytest.mark.asyncio
# # @patch("jockey.jockey_graph.VideoSearchWorker")
# # async def test_worker_node_instruction_generation_error(mock_video_search):
# #     """Test worker node handling when instruction generation fails."""
# #     # Arrange
# #     state = {"next_worker": "video_search", "chat_history": [], "active_plan": "Test plan"}

# #     mock_jockey = MagicMock(spec=Jockey)
# #     mock_jockey.worker_instructor = AsyncMock()
# #     mock_jockey.worker_instructor.ainvoke.side_effect = Exception("Instruction generation failed")

# #     mock_worker = AsyncMock()
# #     mock_worker.name = "video_search"

# #     # Act
# #     result = await Jockey._worker_node(mock_jockey, state, mock_worker)

# #     # Assert
# #     mock_jockey.worker_instructor.ainvoke.assert_called_once_with(state)
# #     assert len(result["chat_history"]) == 1
# #     assert result["chat_history"].name == "instruction_generation_error"
# #     assert "Error when generating video_search instructions" in result["chat_history"].content


# # @pytest.mark.asyncio
# # @patch("jockey.jockey_graph.VideoEditingWorker")
# # async def test_worker_node_twelve_labs_error(mock_video_editing):
# #     """Test worker node handling of TwelveLabsError."""
# #     # Arrange
# #     state = {"next_worker": "video_editing", "chat_history": [], "active_plan": "Test plan"}

# #     mock_jockey = MagicMock(spec=Jockey)
# #     mock_jockey.worker_instructor = AsyncMock()
# #     mock_jockey.worker_instructor.ainvoke.return_value = HumanMessage(content="Test instruction", name="instructor")

# #     mock_worker = AsyncMock()
# #     mock_worker.name = "video_editing"
# #     mock_worker.ainvoke.side_effect = TwelveLabsError(
# #         error_message="Video editing failed", error_type=ErrorType.VIDEO_EDITING, error_state=ErrorState.VIDEO_EDITING_ERROR
# #     )

# #     # Act
# #     result = await Jockey._worker_node(mock_jockey, state, mock_worker)

# #     # Assert
# #     mock_jockey.worker_instructor.ainvoke.assert_called_once_with(state)
# #     mock_worker.ainvoke.assert_called_once_with({"worker_task": [mock_jockey.worker_instructor.ainvoke.return_value]})
# #     assert len(result["chat_history"]) == 1
# #     assert result["chat_history"].name == "VIDEO_EDITING_error"
# #     assert "Please try specifying different video segments" in result["chat_history"].content


# # @pytest.mark.asyncio
# # @patch("jockey.jockey_graph.VideoSearchWorker")
# # async def test_worker_node_unexpected_error(mock_video_search):
# #     """Test worker node handling of unexpected errors."""
# #     # Arrange
# #     state = {"next_worker": "video_search", "chat_history": [], "active_plan": "Test plan"}

# #     mock_jockey = MagicMock(spec=Jockey)
# #     mock_jockey.worker_instructor = AsyncMock()
# #     mock_jockey.worker_instructor.ainvoke.return_value = HumanMessage(content="Test instruction", name="instructor")

# #     mock_worker = AsyncMock()
# #     mock_worker.name = "video_search"
# #     mock_worker.ainvoke.side_effect = Exception("Unexpected error")

# #     # Act
# #     result = await Jockey._worker_node(mock_jockey, state, mock_worker)

# #     # Assert
# #     mock_jockey.worker_instructor.ainvoke.assert_called_once_with(state)
# #     mock_worker.ainvoke.assert_called_once_with({"worker_task": [mock_jockey.worker_instructor.ainvoke.return_value]})
# #     assert len(result["chat_history"]) == 1
# #     assert result["chat_history"].name == "unexpected_worker_error"
# #     assert "An unexpected error occurred" in result["chat_history"].content
# #     assert "The task may need to be reformulated" in result["chat_history"].content
