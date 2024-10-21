import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server
from jockey.util import preflight_checks


def main():
    preflight_checks() # might move this to app.py near check_environment_variables().
    mode = sys.argv[1] if len(sys.argv) > 1 else "terminal"
    if mode == "server":
        return run_jockey_server()
    while True:
        try:
            asyncio.run(run_jockey_terminal())
        except KeyboardInterrupt:
            print("\nExecution interrupted")
            break


if __name__ == "__main__":
    main()
