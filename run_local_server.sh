#!/bin/bash

# Find and kill the process using port 5678
PID=$(lsof -t -i :5678)

if [ -n "$PID" ]; then
  echo "Killing process with PID: $PID"
  kill -9 $PID
else
  echo "No process found using port 5678."
fi

# Launch the langgraph dev command
echo "Launching langgraph dev..."
langgraph dev --config langgraph.json --host 127.0.0.1 --port 2024 --debug-port 5678 --no-browser


