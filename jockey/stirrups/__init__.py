from typing import List, Callable
from .video_search import simple_video_search
from .video_editing import combine_clips, remove_segment
from .video_text_generation import gist_text_generation, summarize_text_generation, freeform_text_generation


def collect_all_tools() -> List[Callable]:
    """Collect all available tools from stirrups modules.

    This is needed to create the tool node in the graph compilation in jockey_graph.py."""
    return [simple_video_search, combine_clips, remove_segment, gist_text_generation, summarize_text_generation, freeform_text_generation]
