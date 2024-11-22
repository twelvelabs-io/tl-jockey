import uuid

from langchain_core.callbacks import AsyncCallbackHandler
from uuid import UUID
from typing import Any, Dict, List, Optional
from langchain_core.callbacks import AsyncCallbackManager
from langchain_core.runnables import RunnableConfig


class JockeyCallbackHandler(AsyncCallbackHandler):
    run_inline: bool = True

    async def on_custom_event(
        self,
        name: str,
        data: Any,
        *,
        run_id: UUID,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        # Create a properly structured event
        event = {
            "event": "on_custom_event",
            "name": name,
            "data": data,
            "run_id": str(run_id),
            "tags": tags or ["jockey"],
            "metadata": metadata or {"source": "jockey"},
        }

        # Log the event for debugging
        print(f"DEBUG: Structured event created: {event}")

        # Process the event based on type
        if name == "human_feedback_received":
            print(f"📝 Human feedback received for {data['current_node']}")
            print(f"Feedback: {data['feedback']}")

        elif name == "ask_human_routing":
            print(f"🔄 Routing from {data['from_node']} to {data['route_to']}")

        elif name == "ask_human_error":
            print(f"❌ Error in ask_human: {data['error']}")

        return event

# Create the callback handler instance
handler = JockeyCallbackHandler()

# Create the callback manager with the handler
callback_manager = AsyncCallbackManager([handler])

session_id = uuid.uuid4()

# Create the thread configuration
thread: RunnableConfig = {
    "configurable": {"thread_id": session_id, "stream_mode": ["custom", "events", "updates"]},
    "callbacks": [handler],  # Use the handler directly instead of manager.handlers
    "tags": ["jockey"],  # Add some tags for better event filtering
    "metadata": {"source": "jockey"},  # Add metadata for better event tracking
}
