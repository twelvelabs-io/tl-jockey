import asyncio
from jockey.cli import run_jockey_terminal, run_jockey_server, process_single_message
from jockey.util import preflight_checks
from config import args


def main():
    if args.debug:
        print("[DEBUG] Debug mode enabled")
        preflight_checks()

    # run server
    if args.server:
        run_jockey_server()

    # run terminal
    else:
        if args.initial_message:
            asyncio.run(process_single_message(args.initial_message))
        else:
            asyncio.run(run_jockey_terminal())


if __name__ == "__main__":
    main()
