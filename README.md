# Jockey

Jockey is a conversational video agent built on top of the [Twelve Labs APIs](https://docs.twelvelabs.io/docs/introduction) and [LangGraph](https://python.langchain.com/v0.1/docs/langgraph/).

Join Twelve Labs' [Multimodal Minds Discord](https://discord.gg/4p9QaBvT6r) server if you have questions or encounter issues when working with Jockey!

## Description

**ATTENTION**: Jockey is in alpha development and may break or behave unexpectedly!

Jockey combines the capabilities of existing Large Language Models (LLMs) with [Twelve Labs' APIs](https://docs.twelvelabs.io/docs/introduction) using [LangGraph](https://python.langchain.com/v0.1/docs/langgraph/). This allows workloads to be allocated to the appropriate foundation models for handling complex video workflows. LLMs are used to logically plan execution steps and interact with users, while video-related tasks are passed to [Twelve Labs APIs](https://docs.twelvelabs.io/docs/introduction), powered by video-foundation models (VFMs), to work with video natively, without the need for intermediary representations like pre-generated captions.

## Quickstart

### Dependencies

- [FFMPEG](https://ffmpeg.org/): Must have `ffmpeg` accessible in `$PATH` for the Video Editing worker.
- [Docker](https://www.docker.com/): Required for running the Jockey API server.
- [Docker Compose](https://docs.docker.com/compose/): Required for running the Jockey API server.
  - Needs to accessible via:
    
    ```bash
    docker compose
    ```

    Depending on your install method it may only be accessible with:

    ```bash
    docker-compose
    ```

    which can cause issues with the `langgraph-cli`. In such a case, you can install [Docker Desktop](https://www.docker.com/products/docker-desktop/) to easily make the above a valid system command.

- Required Python Packages (For Local Dev): [requirements.txt](requirements.txt)
- Twelve Labs API Key: [Twelve Labs Dashboard](https://dashboard.twelvelabs.io/)
- LLM Provider API Key (Currently Azure or Open AI only)

### Setup Steps (Mac OSX)

1. Install the external dependencies listed above ([FFMPEG](https://ffmpeg.org/), [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/))
2. Grab the repo using this command:

    ```bash 
    git clone https://github.com/twelvelabs-io/tl-jockey.git
    ```

3. Enter the `tl-jockey` directory: 

    ```bash
    cd tl-jockey
    ```
4. Create a virtual environment: 

    ```bash 
    python3 -m venv venv
    ```

5. Activate your virtual environment: 

    ```bash 
    source venv/bin/activate
    ```

6. Install Python package requirements:

    ```bash
    pip3 install -r requirements.txt
    ```

7. Create your `.env` file and add the correct variables:

    ```toml
    # This variable is important to include in order to use the most recent version of LangGraph.
    LANGSMITH_API_KEY=<YOUR_LANGSMITH_API_KEY>
    AZURE_OPENAI_ENDPOINT=<IF USING AZURE GPTs>
    AZURE_OPENAI_API_KEY=<IF USING AZURE GPTs>
    OPENAI_API_VERSION=<IF USING AZURE GPTs>
    OPENAI_API_KEY=<IF USING OPEN AI GPTs>
    # Determines which Langchain classes are used to construct Jockey LLM instances.
    LLM_PROVIDER=<MUST BE ONE OF [AZURE, OPENAI]>
    TWELVE_LABS_API_KEY=<YOUR TWELVE LABS API KEY>
    # This variable is used to persist and make rendered video servable from within the LangGraph API container.
    # Please make sure this directory exists on the host machine.
    # Please make sure this directory is available as a File Sharing resource in Docker For Mac.
    HOST_PUBLIC_DIR=<VOLUME MOUNTED TO LANGGRAPH API SERVER CONTAINER WHERE RENDERED VIDEOS GO>
    # This variable is a placeholder that will be used by an upcoming Jockey core worker it currently doesn't impact anything.
    # Please make sure this directory exists on the host machine.
    # Please make sure this directory is available as a File Sharing resource in Docker For Mac.
    HOST_VECTOR_DB_DIR=<VOLUME MOUNTED TO LANGGRAPH API SERVER CONTAINER WHERE VECTOR DB GOES>
    ```

    Make sure your `.env` file is somewhere in the directory tree of the `tl-jockey` directory.

### Deploying in the Terminal

This is an easy and lightweight way to run an instance of Jockey in your terminal. Great for quick testing or validation during local dev work.

[Terminal Example Jockey Video Walkthrough](https://www.loom.com/share/91f9745affbc4967b0f0d502c073d6a7?sid=344ad4e3-809f-489f-aaea-4798e30ccc50)

1. Modify your `.env` file with your desired configuration for an LLM provider.
2. Run the following command from the `tl-jockey` directory (where the `langgraph.json` and `compose.yaml` files are.):
   
   ```bash
   python3 -m jockey terminal
   ```

![Jockey Terminal Startup](assets/jockey_terminal_startup.png)
3. Currently, Jockey requires an Index ID (and in some cases a Video ID) are supplied as part of the conversation history. You are free to modify how this is handled. An example of an initial prompt might be something like:

    Use index 65f747a50db0463b8996bde2. I'm trying to create a funny video focusing on Gordon Ramsay. Can you find 3 clips of Gordon yelling at his chefs about scrambled eggs and then a final clip where Gordon bangs his head on a table. After you find all those clips, lets edit them together into one video.

Since the Index ID is now stored as part of the conversation history, subsequent requests utilizing the same Index ID do not need to explicitly include it as part of the prompt (assuming some reference to the Index ID is still within the context window. For example we could now use the following as a prompt:

    This is awesome but the last clip is too long. Lets shorten the last clip where Gordon hits his head on the table by making it start one second later. Then combine all the clips into a single video again.

### Debugging In The Terminal

The terminal version of Jockey is designed to be a lightweight way to do dev work and have fairly decent access to useful levels of information for debugging. For example, if we take the Gordon Ramsay prompt we used earlier we would see this intermediary output:

![Jockey Terminal Debugging Example](assets/jockey_terminal_debugging_example.png)

As you can see we get the output from all of the individual components of Jockey even including the inputs and outputs to tool calls. This debugging is handled by the [parse_langchain_events_terminal()](jockey/util.py#L31) function and relies on event names and component tags to decide how to parse incoming events. You can modify this code to suite your needs if you need additional information exposed in the terminal. Please note that the tags for the individual components are set in [app.py](jockey/app.py).

### Deploying with the LangGraph API Server

This approach is more suitable for building and testing end-to-end user applications although it takes longer to build.

1. Run the following command from the `tl-jockey` directory (where the `langgraph.json` and `compose.yaml` files are.):

    ```bash
    python3 -m jockey server
    ```

[LangGraph Debugger UI Walkthrough](https://www.loom.com/share/9b7594df37294edcaed31a4b2d901d7b?sid=28a9019d-0ac4-4ca6-a874-d334e2ab1221)

2. Open [LangGraph Debugger](http://localhost:8124/) in your browser to ensure the LangGraph API server is up and reachable.![LangGraph Debugger](assets/langgraph_debugger.png) `jockey` should appear under "Assistants"
3. If you click on `jockey` another panel will open and you can click `New Thread` to step into your running Jockey instance!
4. Visit: [LangGraph Examples](https://github.com/langchain-ai/langgraph-example) for more detailed information on integrating into a user application. You can also check out: [client.ipynb](client.ipynb) for a basic example in a Jupyter notebook.
5. You can use the [LangGraph Debugger](http://localhost:8124/) to step into the Jockey instance and debug end-to-end including adding breakpoints to examine and validate the graph state for any given input.![Jockey LangGraph Debugger](assets/jockey_langgraph_debugger.png)

## Jockey Agent Architecture

![Jockey Architecture](assets/jockey_architecture.jpg)

[Jockey Architecture Walkthrough Video](https://www.loom.com/share/72c64749c3ca473eaeaf6e4643ca2621?sid=57dca306-35a3-4a04-9576-ceb9ddbc7c60)

Jockey consists of three main parts.

1. [**Supervisor**](jockey/jockey_graph.py#L127): Responsible for node routing.
2. [**Planner**](jockey/jockey_graph.py#171): The primary purpose of the planner is to create step-by-step plans for complex user requests.
3. [**Workers**](jockey/jockey_graph.py#L201): The worker nodes consist of two components.
   1. [**Instructor**](jockey/jockey_graph.py#L150): Generates exact and complete task instructions for a single worker based on the plan created by the Planner.
   2. [**Actual Workers**](jockey/stirrups): Agents that ingest the instructions from the instructor and execute them using the tools they have available.

## Customizing Jockey

Jockey comes with a core set of workers for powering a conversational video agent. However, video-related use cases are diverse and complex, and the vanilla core workers may not be adequate for your needs. There are two main ways to customize Jockey that are explored below.

### Prompt as a Feature

This is the most lightweight way to customize Jockey. Use this approach when the agent's functionality or vanilla core workers are sufficient, but the planning capabilities of the LLM are not robust enough for consistent performance across various inputs.

To apply this customization, modify some or all of the [planner.md](jockey/prompts/planner.md) prompt with more targeted and specific instructions. This approach works best for less open-ended use cases that involve minimal dynamic planning.

### Extending or Modifying Jockey

For more complex use cases, the out-of-the-box capabilities of the agent or vanilla core workers may be insufficient. In these instances, consider extending or modifying Jockey in the following ways:

#### Modifying Prompts

This is similar to the [Prompt as a Feature](#prompt-as-a-feature) approach but may require heavily modifying the [planner.md](jockey/prompts/planner.md), [supervisor.md](jockey/prompts/supervisor.md) and [worker](jockey/prompts) prompts.

#### Extending or Modifying State

Given the complex nature of video workflows, the default state that Jockey uses may be inadequate for your use case. Each node in the underlying StateGraph has full access to the JockeyState, allowing you to add or modify state variables to track complex state information that isn't easily handled by LLMs via conversation history. This can help ensure cohesive planning and correct worker selection.

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

#### Adding or Modifying Workers

If the first two customization options aren't sufficient, you can add or modify existing workers:

- **Modifying an Existing Worker**: Add custom logic or tools to an existing worker. You may also need to refine the appropriate [prompts](jockey/prompts).
- **Adding a New Worker**: If none of the existing workers provide the needed capabilities, you can create a new worker. Use the [Stirrup](jockey/stirrups/stirrup.py#L11) class to define your custom worker and modify [jockey_graph.py](jockey/jockey_graph.py) to integrate the new worker into Jockey. Update the appropriate [prompts](jockey/prompts) to ensure Jockey correctly uses the new worker(s).
