import argparse

AZURE_DEPLOYMENTS = {
    "planner": {"deployment_name": "gpt-4o", "model_version": "2024-05-13"},
    "supervisor": {"deployment_name": "gpt-4o", "model_version": "2024-05-13"},
    "worker": {"deployment_name": "gpt-4o-mini", "model_version": "2024-07-18"},
}

OPENAI_MODELS = {
    "planner": "gpt-4o-2024-08-06",
    "supervisor": "gpt-4o-2024-08-06",
    "worker": "gpt-4o-mini-2024-07-18",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Jockey Video Search")
    parser.add_argument("-d", "--debug", action="store_true", help="Enable debug mode")
    parser.add_argument(
        "-i",
        "--initial-message",
        type=str,
        help="Initial message to start the conversation (used for testing)",
        dest="initial_message",
    )
    return parser.parse_args()


args = parse_args()
DEBUG = args.debug
FIRST_USER_MESSAGE = args.initial_message
