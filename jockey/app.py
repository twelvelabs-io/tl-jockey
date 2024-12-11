import os
import sys
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from jockey.jockey_graph import build_jockey_graph
from jockey.util import check_environment_variables

from jockey.model_config import AZURE_DEPLOYMENTS, OPENAI_MODELS
from langgraph.graph.state import CompiledStateGraph
from jockey.jockey_graph import PlannerResponse

check_environment_variables()

# define the LLMs
if os.environ["LLM_PROVIDER"] == "AZURE":
    planner_llm = AzureChatOpenAI(
        deployment_name=AZURE_DEPLOYMENTS["planner"]["deployment_name"],
        streaming=True,
        temperature=0,
        model_version=AZURE_DEPLOYMENTS["planner"]["model_version"],
        tags=["planner"],
    )
    supervisor_llm = AzureChatOpenAI(
        deployment_name=AZURE_DEPLOYMENTS["supervisor"]["deployment_name"],
        streaming=True,
        temperature=0,
        model_version=AZURE_DEPLOYMENTS["supervisor"]["model_version"],
        tags=["supervisor"],
    )
    worker_llm = AzureChatOpenAI(
        deployment_name=AZURE_DEPLOYMENTS["worker"]["deployment_name"],
        streaming=True,
        temperature=0,
        model_version=AZURE_DEPLOYMENTS["worker"]["model_version"],
        tags=["worker"],
    )
    reflect_llm = AzureChatOpenAI(
        deployment_name=AZURE_DEPLOYMENTS["reflect"]["deployment_name"],
        streaming=True,
        temperature=0,
        model_version=AZURE_DEPLOYMENTS["reflect"]["model_version"],
        tags=["reflect"],
    )
elif os.environ["LLM_PROVIDER"] == "OPENAI":
    planner_llm = ChatOpenAI(model=OPENAI_MODELS["planner"], streaming=True, temperature=0, tags=["planner"])
    supervisor_llm = ChatOpenAI(model=OPENAI_MODELS["supervisor"], streaming=True, temperature=0, tags=["supervisor"])
    worker_llm = ChatOpenAI(model=OPENAI_MODELS["worker"], streaming=True, temperature=0, tags=["worker"])
    reflect_llm = ChatOpenAI(model=OPENAI_MODELS["reflect"], streaming=True, temperature=0, tags=["reflect"])
else:
    print(f"LLM_PROVIDER environment variable is incorrect. Must be one of: [AZURE, OPENAI] but got {os.environ['LLM_PROVIDER']}")
    sys.exit("Incorrect LLM_PROVIDER environment variable.")

# bind the tools to the LLMs
planner_llm = planner_llm.bind_tools([PlannerResponse], strict=True, response_format=PlannerResponse)
"""Convenience function for standing up a local Jockey instance for dev work."""

# get the prompts
prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")
prompts = {}
for name in ["supervisor", "planner", "instructor", "reflect"]:
    with open(os.path.join(prompts_dir, f"{name}.md")) as f:
        prompts[f"{name}_prompt"] = f.read()

supervisor_prompt = prompts["supervisor_prompt"]
planner_prompt = prompts["planner_prompt"]
instructor_prompt = prompts["instructor_prompt"]
reflect_prompt = prompts["reflect_prompt"]

# Build and compile the Jockey graph
jockey: CompiledStateGraph = build_jockey_graph(
    planner_prompt=planner_prompt,
    planner_llm=planner_llm,
    supervisor_prompt=supervisor_prompt,
    supervisor_llm=supervisor_llm,
    worker_llm=worker_llm,
    instructor_prompt=instructor_prompt,
    reflect_llm=reflect_llm,
    reflect_prompt=reflect_prompt,
)
