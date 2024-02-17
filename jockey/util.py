from langchain_core.callbacks.base import AsyncCallbackHandler
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from uuid import UUID
from rich import print
from rich.console import Console
from langchain_core.outputs import ChatGenerationChunk, GenerationChunk
from langchain_core.agents import AgentFinish

CONSOLE = Console(width=80)

class TokenByTokenHandler(AsyncCallbackHandler):
    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        inputs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Run when tool starts running."""
        CONSOLE.print(f"[cyan]=> Using: {serialized["name"]}")

    async def on_llm_new_token(
        self,
        token: str,
        *,
        chunk: Optional[Union[GenerationChunk, ChatGenerationChunk]] = None,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""

        CONSOLE.print(f"[white]{token}", end="")

    async def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> Any:
        """Run on agent end."""
        CONSOLE.print("\n")