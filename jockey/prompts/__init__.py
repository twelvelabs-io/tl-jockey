import os

DEFAULT_PROMPTS_DIR = os.path.abspath(os.path.dirname(__file__))
DEFAULT_INSTRUCTOR_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "instructor.md"))
DEFAULT_PLANNER_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "planner.md"))
DEFAULT_SUPERVISOR_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "supervisor.md"))
DEFAULT_VIDEO_EDITING_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "video_editing.md"))
DEFAULT_VIDEO_SEARCH_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "video_search.md"))
DEFAULT_VIDEO_TEXT_GENERATION_FILE_PATH = os.path.abspath(os.path.join(DEFAULT_PROMPTS_DIR, "video_text_generation.md"))
