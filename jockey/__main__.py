import asyncio
import sys
from jockey.cli import run_jockey_terminal, run_jockey_server

def main():
    if sys.argv[1] == "terminal":
        asyncio.run(run_jockey_terminal())
    elif sys.argv[1] == "server":
        run_jockey_server()
    else:
        asyncio.run(run_jockey_terminal())

if __name__ == "__main__":
    main()