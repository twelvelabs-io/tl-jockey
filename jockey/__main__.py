import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server
from jockey.util import preflight_checks


def main():
    preflight_checks()

    mode = "terminal"
    if len(sys.argv) > 1:
        mode = sys.argv[1]

    if mode == "server":
        run_jockey_server()
        return

    while True:
        try:
            asyncio.run(run_jockey_terminal())
        except KeyboardInterrupt:
            print("\nExecution interrupted")
            break


if __name__ == "__main__":
    main()
