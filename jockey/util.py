import os
import requests
import urllib
import time
from langchain_core.callbacks.base import AsyncCallbackHandler
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from uuid import UUID
from rich import print
from rich.console import Console
from langchain_core.outputs import ChatGenerationChunk, GenerationChunk
from langchain_core.agents import AgentFinish

TL_BASE_URL = "https://api.twelvelabs.io/v1.2/"
INDEX_URL = urllib.parse.urljoin(TL_BASE_URL, "indexes/")
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


def get_video_metadata(index_id: str, video_id: str) -> dict:
    video_url = f"{INDEX_URL}{index_id}/videos/{video_id}"

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": os.environ["TWELVE_LABS_API_KEY"]
    }

    response = requests.get(video_url, headers=headers)

    return response

def parse_langserve_events(event: dict):
    if event["event"] == "on_chat_model_stream":
        content = event["data"]["chunk"].content
        if content:
            print(f"{content}", end="", flush=True)
            time.sleep(0.05)
    elif event["event"] == "on_tool_start":
        tool = event["name"]
        print(f"Running => {tool}", end="\n", flush=True)
    elif event["event"] == "on_tool_end":
        tool = event["name"]
        print(f"Finished running {tool}", end="\n", flush=True)
