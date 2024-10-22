import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server
from jockey.util import preflight_checks


def main(loop_mode=True):  # Added loop_mode to control looping in tests
    # preflight_checks()
    mode = sys.argv[1] if len(sys.argv) > 1 else "terminal"
    if mode == "server":
        run_jockey_server()
    else:
        while loop_mode:  # Condition controlled by flag
            try:
                asyncio.run(run_jockey_terminal())
            except KeyboardInterrupt:
                print("\nExecution interrupted")


if __name__ == "__main__":
    main()
