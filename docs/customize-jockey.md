# Customize Jockey

Jockey comes with a core set of workers to power a conversational video agent. However, video-related use cases are diverse and complex, and the vanilla core workers may not be adequate for your needs. This document outlines different approaches to customizing Jockey.

## Prompt as a Feature

This is the most lightweight way to customize Jockey. Use this approach when the agent's functionality or vanilla core workers are sufficient. Still, the planning capabilities of the LLM are not robust enough for consistent performance across various inputs.

To apply this customization, modify some or all of the prompts in the [planner.md](jockey/prompts/planner.md) file with more targeted and specific instructions. This approach works best for less open-ended use cases that involve minimal dynamic planning.

### Extend or Modify Jockey

For more complex use cases, the out-of-the-box capabilities of the agent or vanilla core workers may be insufficient. In these instances, consider extending or modifying Jockey as described in the sections below.

#### Modify Prompts

This is similar to the [Prompt as a Feature](#prompt-as-a-feature) approach. For more extensive customization, you may need to modify multiple prompt files: 

- [planner.md](../jockey/prompts/planner.md)
- [supervisor.md](../jockey/prompts/supervisor.md)
- [worker](../jockey/prompts)


#### Extend or Modify the State

Given the complex nature of video workflows, the default state that Jockey uses may be inadequate for your use case. Each node in the underlying `StateGraph` has full access to the `JockeyState`, allowing you to add or modify state variables to track complex state information that isn't easily handled by LLMs via conversation history. This can help ensure cohesive planning and correct worker selection.


Example:

```python
# Default JockeyState
class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    next_worker: str
    made_plan: bool
    active_plan: str
```

To handle multiple sequences of video that could be rendered, extend JockeyState:

```python
class Clip(BaseModel):
    """Define what constitutes a clip."""
    index_id: str = Field(description="A UUID for the index a video belongs to. This is different from the video_id.")
    video_id: str = Field(description="A UUID for the video a clip belongs to.")
    start: float = Field(description="The start time of the clip in seconds.")
    end: float = Field(description="The end time of the clip in seconds.")

class Sequence(BaseModel):
    """Represents a single sequence of renderable video and its constituents."""
    clips: List[Clip]
    sequence_name: str

# Extended JockeyState
class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    next_worker: str
    made_plan: bool
    active_plan: str
    sequences: Dict[str, Sequence]
```

This could allow you to manage multiple versions of a sequence that can be selectively rendered or easily modified.

#### Add or Modify Workers

If the first two customization options aren't sufficient, you can add or modify existing workers:

- **Modifying an Existing Worker**: Add custom logic or tools to an existing worker. You may also need to refine the appropriate [prompts](jockey/prompts).
- **Adding a New Worker**: If none of the existing workers provide the needed capabilities, you can create a new worker. Use the [Stirrup](jockey/stirrups/stirrup.py#L11) class to define your custom worker and modify [jockey_graph.py](jockey/jockey_graph.py) to integrate the new worker into Jockey. Update the appropriate [prompts](jockey/prompts) to ensure Jockey correctly uses the new worker(s).
