import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server, process_single_message
from jockey.util import preflight_checks
from config import args


def main():
    if args.debug:
        print("[DEBUG] Debug mode enabled")
        # preflight_checks()

    mode = sys.argv[1] if len(sys.argv) > 1 else "terminal"

    if mode == "server":
        run_jockey_server()
        return

    if args.initial_message:
        # Handle single message mode
        asyncio.run(process_single_message(args.initial_message))
        return

    # Regular interactive mode
    while True:
        asyncio.run(run_jockey_terminal())


if __name__ == "__main__":
    main()
