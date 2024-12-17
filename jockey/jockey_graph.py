import functools
import json
import os
from typing import Annotated, Union, Sequence, Dict, List, Literal, Any
from typing_extensions import TypedDict
from langchain_openai.chat_models.base import ChatOpenAI
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.runnables import Runnable
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from jockey.stirrups.video_search import VideoSearchWorker
from jockey.stirrups.video_text_generation import VideoTextGenerationWorker
from jockey.stirrups.video_editing import VideoEditingWorker
from langgraph.prebuilt import ToolNode
from jockey.stirrups import collect_all_tools
from langgraph.graph.state import CompiledStateGraph
from textwrap import dedent
from openai import OpenAI
from .model_config import OPENAI_MODELS
from pydantic import BaseModel, Field
from jockey.stirrups.video_search import MarengoSearchInput
from jockey.stirrups.video_editing import SimplifiedCombineClipsInput, Clip
import copy


def add_clips(left: Dict[str, List[Clip]], right: Dict[str, List[Clip]]) -> Dict[str, List[Clip]]:
    """Merges two dictionaries of clips, maintaining unique tool_call_ids and preventing duplicates.

    Args:
        left: The base dictionary of clips.
        right: The dictionary of clips to merge into the base dictionary.

    Returns:
        A new dictionary with unique clips from `right` merged into `left`.
        If a tool_call_id in `right` exists in `left`, only new unique clips
        will be appended to the existing list.

    Examples:
        >>> clips1 = {"call_1": [Clip(video_id="1", start=0, end=10)]}
        >>> clips2 = {"call_2": [Clip(video_id="2", start=5, end=15)]}
        >>> add_clips(clips1, clips2)
        {'call_1': [Clip(video_id="1", start=0, end=10)],
         'call_2': [Clip(video_id="2", start=5, end=15)]}
    """
    # Create a new dictionary to store merged results
    merged = left.copy()

    # Merge clips from right into the merged dictionary
    for tool_call_id, clips in right.items():
        if tool_call_id in merged:
            # Ensure we're working with lists before extending
            if not isinstance(merged[tool_call_id], list):
                merged[tool_call_id] = [merged[tool_call_id]]
            if not isinstance(clips, list):
                clips = [clips]

            # Create a set of existing clips for efficient comparison
            existing_clips = {(clip.start, clip.end) for clip in merged[tool_call_id]}

            # Only add clips that don't already exist
            new_clips = [clip for clip in clips if (clip.start, clip.end) not in existing_clips]

            # Extend with only the new unique clips
            merged[tool_call_id].extend(new_clips)
        else:
            # If tool_call_id is new, ensure clips is a list
            merged[tool_call_id] = clips if isinstance(clips, list) else [clips]

    return merged


class SupervisorResponse(BaseModel):
    route_to_node: Literal["planner", "reflect"] = Field()


class PlannerResponse(BaseModel):
    route_to_node: Literal["planner", "video-search", "video-text-generation", "video-editing", "reflect"] = Field(
        description="""
        Available workers:
        <worker name="video-search", tools="simple-video-search">
            Purpose: Search for N clips/videos matching a natural language query
            Input: Index ID, search query, number of clips needed
            Output: List of clips with video IDs and timestamps (start/end in seconds)
        </worker>
        <worker name="video-editing", tools="combine-clips">
            Purpose: Edit and combine video clips
            Input: List of video IDs with start/end times
            Output: Filepath of edited video
        </worker>
        """
    )
    tool_call: Literal["simple-video-search", "combine-clips", "none"] = Field(
        description="""
        Define the tool required by the route_to_node. If no tool is required, use 'none'.
        """
    )
    plan: str = Field(
        description="""
        <instructions>
            1. Format steps ONLY as: "**worker-name**: Description"
            2. Do not include explanatory text - only output the planner steps
            3. You must always video-search before video-text-generation or video-editing
        </instructions>
        <rules>
            1. ALWAYS include Index ID in worker tasks
            2. ONLY use Index IDs provided by the user
            3. Each step must include complete, and concise context
        </rules>
        """
    )
    index_id: str = Field(
        description="""
        parse the index_id from the <latest_user_message>
        """
    )
    clip_keys: List[str] = Field(
        description="""
        clips are currently stored in <clips_from_search> 
        You are to return only the key(s) relevant to clips necessary for the video-editing step outlined in <latest_user_message>
        if ambiguous, only return the latest clip_keys
        """
    )


class JockeyState(TypedDict):
    """Used to track the state between nodes in the graph."""

    next_worker: Union[str, None]
    chat_history: Annotated[Sequence[BaseMessage], add_messages]
    made_plan: bool = False
    active_plan: Union[str, HumanMessage, None]
    tool_call: Union[str, None]
    clips_from_search: Annotated[Dict[str, List[Clip]], add_clips]
    index_id: Union[Annotated[str, lambda left, right: right or left], None]  # for now let's assume per chat we only have 1 index_id
    relevant_clip_keys: List[str]


class Jockey(StateGraph):
    """Conversational video agent designed to be modular and easily editable."""

    workers: Sequence[AgentExecutor]
    supervisor: Runnable
    router: Dict
    planner_prompt: str
    planner_llm: Union[ChatOpenAI, AzureChatOpenAI]
    supervisor_prompt: str
    supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI]
    worker_llm: Union[ChatOpenAI, AzureChatOpenAI]
    worker_instructor: Runnable
    _compiled_instance = None  # Class variable to store compiled instance

    def __init__(
        self,
        planner_llm: Union[ChatOpenAI, AzureChatOpenAI],
        planner_prompt: str,
        instructor_prompt: str,
        supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI],
        supervisor_prompt: str,
        worker_llm: Union[ChatOpenAI, AzureChatOpenAI],
        reflect_llm: Union[ChatOpenAI, AzureChatOpenAI],
        reflect_prompt: str,
    ) -> None:
        """Constructs and compiles Jockey as a StateGraph instance.

        Args:
            planner_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.

            planner_prompt (str):
                String version of the system prompt for the planner.

            supervisor_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

            supervisor_prompt (str):
                String version of the system prompt for the supervisor.

            worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the worker nodes. It is recommended this be a GPT-4 class LLM or better.
        """

        super().__init__(state_schema=JockeyState)
        self.openai_client = OpenAI()
        self.reflect_llm = reflect_llm
        self.reflect_prompt = dedent(reflect_prompt)
        self.planner_prompt = planner_prompt
        self.instructor_prompt = instructor_prompt
        self.planner_llm = planner_llm
        self.supervisor_prompt = supervisor_prompt
        self.supervisor_llm = supervisor_llm
        self.worker_llm = worker_llm

        # collect all @tools from stirrups
        self.all_tools = collect_all_tools()
        self.tool_node = ToolNode(self.all_tools)

        self.workers = self._build_core_workers()
        # self.router = self._build_router()
        self.worker_instructor = self._build_worker_instructor()
        self.construct_graph()

    def __getattr__(self, name: str) -> Any:
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"'State' object has no attribute '{name}'")

    def _build_core_workers(self) -> Sequence[AgentExecutor]:
        """Builds the core workers that are managed and called by the supervisor.

        Args:
            worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
                The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.
        Raises:
            TypeError: If the worker_llm instance type isn't currently supported.

        Returns:
            Sequence[AgentExecutor]: The core workers of a Jockey instance.
        """
        if any(map(lambda x: isinstance(self.worker_llm, x), [ChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"Worker LLM must be one of: ChatOpenAI, AzureChatOpenAI. Got: {type(self.worker_llm).__name__}")

        video_search_worker = VideoSearchWorker.build_worker(worker_llm=self.worker_llm)
        video_text_generation_worker = VideoTextGenerationWorker.build_worker(worker_llm=self.worker_llm)
        video_editing_worker = VideoEditingWorker.build_worker(worker_llm=self.worker_llm)
        return [video_search_worker, video_text_generation_worker, video_editing_worker]

    def _build_worker_instructor(self) -> Runnable:
        """Constructs the worker_instructor which generates singular tasks for a given step in a plan generated by the planner node.


        Returns:
            Runnable: The worker_instructor of the Jockey instance.
        """
        with open(os.path.join(os.path.dirname(__file__), "prompts", "instructor.md"), "r") as instructor_prompt_file:
            instructor_system_prompt = instructor_prompt_file.read()

        instructor_prompt = ChatPromptTemplate.from_messages([
            ("system", instructor_system_prompt),
            ("human", "{active_plan}"),
            ("human", "{next_worker}"),
        ])
        worker_instructor: Runnable = instructor_prompt | self.planner_llm

        # The tag here is used for parsing events to the console when running locally.
        # We assign a separate tag since we are using the planner_llm which should already have a tag.
        worker_instructor = worker_instructor.with_config({"tags": ["instructor"]})
        return worker_instructor

    def _supervisor_node(self, state: JockeyState) -> Dict:
        """Builds the supervisor which acts as the routing agent.

        Raises:
            TypeError: If the supervisor_llm instance type isn't currently supported.

        Returns:
            Runnable: The supervisor of the Jockey instance.
        """
        completion = self.openai_client.beta.chat.completions.parse(
            model=OPENAI_MODELS["supervisor"],
            messages=[
                {"role": "system", "content": dedent(self.supervisor_prompt)},
                {"role": "user", "content": dedent(f"<chat_history>{state['chat_history']}</chat_history>")},
            ],
            response_format=SupervisorResponse,
            temperature=0,
        )
        supervisor_response: SupervisorResponse = completion.choices[0].message.parsed
        return {"next_worker": supervisor_response.route_to_node}

    async def _planner_node(self, state: JockeyState) -> Dict:
        """The planner_node in the StateGraph instance. The planner is responsible to generating a plan for a given user request.

        Args:
            state (JockeyState): Current state of the graph.

        Raises:
            TypeError: If the planner_llm instance type isn't currently supported.

        Returns:
            Dict: Updated state of the graph.
        """
        latest_user_message = state["chat_history"][-1].content

        # Remove `thumbnail_url` and `video_url` from each Clip
        clips_from_search_copy = copy.deepcopy(state["clips_from_search"]) if state["clips_from_search"] else {}
        if clips_from_search_copy:
            [setattr(clip, "thumbnail_url", None) or setattr(clip, "video_url", None) for clips in clips_from_search_copy.values() for clip in clips]

        # retrieve available tool_call_ids
        available_tool_call_ids: List[str] = list(clips_from_search_copy.keys())
        if available_tool_call_ids:
            PlannerResponse.model_fields["clip_keys"].annotation = List[Literal.__getitem__(tuple(available_tool_call_ids))]

        completion = self.openai_client.beta.chat.completions.parse(
            model=OPENAI_MODELS["planner"],
            messages=[
                {"role": "system", "content": dedent(self.planner_prompt)},
                {"role": "user", "content": dedent(f"<chat_history>{state['chat_history']}</chat_history>")},
                {"role": "user", "content": dedent(f"<active_plan>{state['active_plan']}</active_plan>")},
                {"role": "user", "content": dedent(f"<latest_user_message>{latest_user_message}</latest_user_message>")},
                {"role": "user", "content": dedent(f"<clips_from_search>{clips_from_search_copy}</clips_from_search>")},
            ],
            temperature=0.7,
            response_format=PlannerResponse,
        )
        planner_response: PlannerResponse = completion.choices[0].message.parsed

        # let's replace the planner_response.plan with the actual clips to prevent the LLM from hallucinating
        # this is a temporary solution until openai allows us to make some fields optional, however everything is required for now
        # https://platform.openai.com/docs/guides/structured-outputs#all-fields-must-be-required
        if planner_response.route_to_node == "video-editing":
            call_tool_ids: List[str] = [key for key in state["clips_from_search"].keys() if key.startswith("call_")]
            clips_from_search = [clip for tool_id in planner_response.clip_keys for clip in state["clips_from_search"][tool_id]]
            # remove unneeded fields like thumbnail_url and video_url in chat_history
            [setattr(clip, "thumbnail_url", None) or setattr(clip, "video_url", None) for clip in clips_from_search]
            planner_response.plan = str(clips_from_search)

        # We return the response from the planner as a special human with the name of "planner".
        # This helps with understanding historical context as the chat history grows.
        print(f"[DEBUG] Planner response: {planner_response}")
        lc_planner_response = AIMessage(content=planner_response.plan, name="planner")
        # We update the graph state to ensure the supervisor has access to the `active_plan` and is selected as the `next_worker`
        # The supervisor is also made aware that the planner was called via `made_plan`

        return {
            "chat_history": [lc_planner_response],
            "active_plan": planner_response.plan,
            "index_id": planner_response.index_id if not state["index_id"] else state["index_id"],
            "next_worker": planner_response.route_to_node,
            "tool_call": planner_response.tool_call if planner_response.tool_call != "none" else None,
            "made_plan": True,
            "relevant_clip_keys": planner_response.clip_keys,
        }

    async def _worker_node(self, state: JockeyState, worker: Runnable) -> Dict:
        """A worker_node in the StateGraph instance. Workers are responsible for directly calling tools in their domains.
        This node isn't used directly but is wrapped with a functools.partial call.

        Args:
            state (JockeyState): Current state of the graph.
            worker (Runnable): The actual worker Runnable.

        Returns:
            Dict: Updated state of the graph.
        """
        worker_schemas = {"video-search": MarengoSearchInput, "video-editing": SimplifiedCombineClipsInput}

        worker_to_stirrup = {
            "video-search": VideoSearchWorker,
            "video-text-generation": VideoTextGenerationWorker,
            "video-editing": VideoEditingWorker,
        }

        try:
            completion = self.openai_client.beta.chat.completions.parse(
                model=OPENAI_MODELS["worker"],
                messages=[
                    {"role": "system", "content": dedent(self.instructor_prompt)},
                    {"role": "user", "content": dedent(f"<active_plan>{state['active_plan']}</active_plan>")},
                    {"role": "user", "content": dedent(f"<tool_call>{state['tool_call']}</tool_call>")},
                ],
                response_format=worker_schemas[state["next_worker"]],
                temperature=0.7,
            )

            worker_inputs: Union[MarengoSearchInput, SimplifiedCombineClipsInput] = completion.choices[0].message.parsed
            # print(f"[DEBUG] Worker inputs: {worker_inputs}")
        except Exception as error:
            raise error

        # let's make a call to the stirrup to execute the tool call
        ai_message = None

        # get the id of the chat_history
        tool_call_id = state["chat_history"][-1].id

        # craft the args for the tool call
        args = {}
        if state["next_worker"] == "video-search":
            args = worker_inputs.model_dump()
        elif state["next_worker"] == "video-editing" and state["tool_call"] == "combine-clips":
            args = worker_inputs.model_dump()
            args["clips"] = [clip for key in state["relevant_clip_keys"] for clip in state["clips_from_search"][key]]
            args["index_id"] = state["index_id"]

        if state["tool_call"]:
            ai_message = AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": state["tool_call"],
                        "args": args,
                        "id": tool_call_id,
                        "type": "tool_call",
                    }
                ],
            )
        try:
            worker_response = await worker_to_stirrup[state["next_worker"]]._call_tools(ai_message)
        except Exception as error:
            print(f"[DEBUG] Error in worker_node: {error}")
            raise error

        def fix_escaped_unicode(data) -> str:
            if isinstance(data, str):
                return data.encode("utf-8").decode("unicode_escape")
            elif isinstance(data, list):
                return [fix_escaped_unicode(item) for item in data]
            elif isinstance(data, dict):
                return {key: fix_escaped_unicode(value) for key, value in data.items()}
            return str(data)

        worker_response_str = fix_escaped_unicode(worker_response)

        # add clips to state['clips_from_search']
        clips_from_search = state.get("clips_from_search", {})
        if state["next_worker"] == "video-search":
            clips_from_search[tool_call_id] = [Clip(**clip) for clip in json.loads(worker_response[0]["output"])]

        # convert worker_response_str to a BaseMessage
        worker_response_str = ToolMessage(content=worker_response_str, tool_call_id=tool_call_id, name=state["next_worker"], additional_kwargs={})

        return {
            "chat_history": [worker_response_str],
            "active_plan": state["active_plan"],
            "next_worker": "reflect",
            "clips_from_search": clips_from_search,
        }

    async def _reflect_node(self, state: JockeyState) -> Dict:
        """The reflect node in the graph. This node reviews all the context for a given user input before generating a final output.

        Args:
            state (JockeyState): Current state of the graph.

        Returns:
            Dict: Updated state of the graph.
        """
        reflect_prompt = ChatPromptTemplate.from_messages([
            ("system", self.reflect_prompt),
        ])
        reflect_chain = reflect_prompt | self.reflect_llm
        reflect_response = await reflect_chain.ainvoke(
            {
                "active_plan": state["active_plan"] if state["active_plan"] else state["chat_history"][-1].content,
                "tool_call": state["tool_call"],
                "chat_history": state["chat_history"],
            },
        )
        return {
            "chat_history": [reflect_response],
            "active_plan": None,
            "tool_call": None,
            "made_plan": False,
        }

    def construct_graph(self):
        """Construct the actual Jockey agent as a graph."""

        # create nodes
        self.add_node("planner", self._planner_node)
        self.add_node("supervisor", self._supervisor_node)
        self.add_node("reflect", self._reflect_node)

        # connect workers to supervisor
        for worker in self.workers:
            worker_node = functools.partial(self._worker_node, worker=worker)
            self.add_node(worker.name, worker_node)
            self.add_edge(worker.name, "reflect")

        # core flow
        self.set_entry_point("supervisor")
        self.add_edge("reflect", END)

        # Conditional routing based on supervisor node's output
        self.add_conditional_edges(
            "supervisor",
            lambda state: state["next_worker"],
            {
                "reflect": "reflect",
                "planner": "planner",
            },
        )

        self.add_conditional_edges(
            "planner",
            lambda state: state["next_worker"],
            {
                **{f"{worker.name}": worker.name for worker in self.workers},
                "reflect": "reflect",
            },
        )


def build_jockey_graph(
    planner_prompt: str,
    planner_llm: Union[ChatOpenAI, AzureChatOpenAI],
    supervisor_prompt: str,
    supervisor_llm: Union[ChatOpenAI, AzureChatOpenAI],
    worker_llm: Union[ChatOpenAI, AzureChatOpenAI],
    instructor_prompt: str,
    reflect_llm: Union[ChatOpenAI, AzureChatOpenAI],
    reflect_prompt: str,
) -> CompiledStateGraph:
    """Convenience function for creating an instance of Jockey.

    Args:
        planner_prompt (str):
            String version of the system prompt for the planner.

        planner_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the planner node. It is recommended this be a GPT-4 class LLM.

        supervisor_prompt (str):
            String version of the system prompt for the supervisor.

        supervisor_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the supervisor. It is recommended this be a GPT-4 class LLM or better.

        worker_llm (Union[ChatOpenAI  |  AzureChatOpenAI]):
            The LLM used for the planner node. It is recommended this be a GPT-4 class LLM or better.

    Returns:
        Jockey: An instance of Jockey a video agent.
    """

    # Simple call to instantiate a Jockey instance.
    jockey_graph = Jockey(
        planner_prompt=planner_prompt,
        planner_llm=planner_llm,
        supervisor_prompt=supervisor_prompt,
        supervisor_llm=supervisor_llm,
        worker_llm=worker_llm,
        instructor_prompt=instructor_prompt,
        reflect_llm=reflect_llm,
        reflect_prompt=reflect_prompt,
    )

    memory = MemorySaver()
    jockey = jockey_graph.compile(checkpointer=memory)

    # Save the graph visualization to a PNG file
    with open("graph.png", "wb") as f:
        f.write(jockey.get_graph().draw_mermaid_png())

    return jockey
