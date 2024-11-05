import os
import sys
import json
import requests
from dotenv import find_dotenv, load_dotenv
from rich.padding import Padding
from rich.console import Console
from rich.json import JSON
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    ConflictError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    APIError,
    UnprocessableEntityError,
    OpenAI,
)
from config import AZURE_DEPLOYMENTS, OPENAI_MODELS
from openai import AzureOpenAI
import time


REQUIRED_ENVIRONMENT_VARIABLES = set(["TWELVE_LABS_API_KEY", "HOST_PUBLIC_DIR", "LLM_PROVIDER"])
AZURE_ENVIRONMENT_VARIABLES = set(["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "OPENAI_API_VERSION"])
OPENAI_ENVIRONMENT_VARIABLES = set(["OPENAI_API_KEY"])
ALL_JOCKEY_ENVIRONMENT_VARIABLES = REQUIRED_ENVIRONMENT_VARIABLES | AZURE_ENVIRONMENT_VARIABLES | OPENAI_ENVIRONMENT_VARIABLES
LOCAL_LANGGRAPH_URL = "http://localhost:8000"


async def parse_langchain_events_terminal(event: dict):
    """Used to parse events emitted from Jockey when called as an API."""
    console = Console()

    with open("event_log.txt", "a") as f:
        f.write(f"{event}\n")

    if event["event"] == "on_chat_model_stream":
        if isinstance(event["data"]["chunk"], dict):
            content = event["data"]["chunk"]["content"]
        else:
            content = event["data"]["chunk"].content

        if content and "instructor" in event["tags"]:
            console.print(f"[red]{content}", end="")
        elif content and "planner" in event["tags"]:
            console.print(f"[yellow]{content}", end="")
        elif content and "supervisor" in event["tags"]:
            console.print(f"[white]{content}", end="")

    elif event["event"] == "on_tool_start":
        tool = event["name"]
        console.print(Padding(f"[cyan]🏇 Using: {tool}", (1, 0, 0, 2)))
        console.print(Padding(f"[cyan]🏇 Inputs:", (0, 2)))
        console.print(Padding(JSON(json.dumps(event["data"]["input"]), indent=2), (1, 6)))

    elif event["event"] == "on_tool_end":
        tool = event["name"]
        console.print(Padding(f"[cyan]🏇 Finished Using: {tool}", (0, 2)))
        console.print(Padding(f"[cyan]🏇 Outputs:", (0, 2)))
        try:
            console.print(Padding(JSON(event["data"]["output"], indent=2), (1, 6)))
        except (json.decoder.JSONDecodeError, TypeError):
            console.print(Padding(str(event["data"]["output"]), (0, 6)))

    elif event["event"] == "on_chat_model_start":
        if "instructor" in event["tags"]:
            console.print(Padding(f"[red]🏇 Instructor: ", (1, 0)), end="")
        elif "planner" in event["tags"]:
            console.print(Padding(f"[yellow]🏇 Planner: ", (1, 0)), end="")
        elif "reflect" in event["tags"]:
            console.print()
            console.print(f"[cyan]🏇 Jockey: ", end="")


def check_environment_variables():
    """Check that a .env file contains the required environment variables.
    Uses the current working directory tree to search for a .env file."""
    # Assume the .env file is someone on the current working directory tree.
    load_dotenv(find_dotenv(usecwd=True))

    if REQUIRED_ENVIRONMENT_VARIABLES & os.environ.keys() != REQUIRED_ENVIRONMENT_VARIABLES:
        missing_environment_variables = REQUIRED_ENVIRONMENT_VARIABLES - os.environ.keys()
        print(f"Expected the following environment variables:\n\t{str.join(', ', REQUIRED_ENVIRONMENT_VARIABLES)}")
        print(f"Missing:\n\t{str.join(', ', missing_environment_variables)}")
        sys.exit("Missing required environment variables.")

    if (
        AZURE_ENVIRONMENT_VARIABLES & os.environ.keys() != AZURE_ENVIRONMENT_VARIABLES
        and OPENAI_ENVIRONMENT_VARIABLES & os.environ.keys() != OPENAI_ENVIRONMENT_VARIABLES
    ):
        missing_azure_environment_variables = AZURE_ENVIRONMENT_VARIABLES - os.environ.keys()
        missing_openai_environment_variables = OPENAI_ENVIRONMENT_VARIABLES - os.environ.keys()
        print(f"If using Azure, Expected the following environment variables:\n\t{str.join(', ', AZURE_ENVIRONMENT_VARIABLES)}")
        print(f"Missing:\n\t{str.join(', ', missing_azure_environment_variables)}")

        print(f"If using Open AI, Expected the following environment variables:\n\t{str.join(', ', OPENAI_ENVIRONMENT_VARIABLES)}")
        print(f"Missing:\n\t{str.join(', ', missing_openai_environment_variables)}")
        sys.exit("Missing Azure or Open AI environment variables.")


def preflight_checks():
    print("Performing preflight checks...")
    load_dotenv()

    llm_provider = os.getenv("LLM_PROVIDER")
    if llm_provider == "OPENAI":
        api_key = os.getenv("OPENAI_API_KEY")
        client = OpenAI(api_key=api_key)
        models = list(OPENAI_MODELS.values())
    elif llm_provider == "AZURE":
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        client = AzureOpenAI(api_key=api_key, azure_endpoint=endpoint)
        models = [config["deployment_name"] for config in AZURE_DEPLOYMENTS.values()]

        # assert that the models are correct
        # print(models, [config["deployment_name"] for config in AZURE_DEPLOYMENTS.values()])
        assert all(model in models for model in [config["deployment_name"] for config in AZURE_DEPLOYMENTS.values()])
    else:
        print("Invalid LLM_PROVIDER. Must be one of: [AZURE, OPENAI]")
        sys.exit("Invalid LLM_PROVIDER environment variable.")

    for model in models:
        print(f"[DEBUG] Testing model: {model}")
        for stream in [False, True]:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "system", "content": "Test message"}],
                    temperature=0,
                    max_tokens=2048,
                    stream=stream,
                    timeout=10,  # Add 10 second timeout
                )
                if stream:
                    # Process stream with timeout using a simple counter
                    start_time = time.time()
                    timeout_seconds = 10
                    has_content = False

                    for chunk in response:
                        if time.time() - start_time > timeout_seconds:
                            return f"Timeout occurred while processing stream. Model: {model}"
                        if chunk.choices and chunk.choices[0].delta.content is not None:
                            has_content = True
                            break

                    if not has_content:
                        return f"API request failed. Streaming: {stream}. Model: {model}. Check your API key or usage limits."
                elif not response.choices[0].message.content:
                    return f"API request failed. Streaming: {stream}. Model: {model}. Check your API key or usage limits."
            except (
                APIConnectionError,
                APITimeoutError,
                AuthenticationError,
                BadRequestError,
                ConflictError,
                InternalServerError,
                NotFoundError,
                PermissionDeniedError,
                RateLimitError,
                APIError,
                UnprocessableEntityError,
                requests.exceptions.Timeout,  # Add requests timeout
            ) as e:
                return f"{type(e).__name__} occurred. Model: {model}. Error: {str(e)}"

    return "Preflight checks passed. All models functioning correctly."
