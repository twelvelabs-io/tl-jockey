import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server
from jockey.util import preflight_checks


def main(loop_mode=True):
    # uncomment to run preflight checks
    # preflight_checks()
    mode = sys.argv[1] if len(sys.argv) > 1 else "terminal"
    if mode == "server":
        run_jockey_server()
    else:
        while loop_mode:  # Condition controlled by flag
            asyncio.run(run_jockey_terminal())


if __name__ == "__main__":
    main()
