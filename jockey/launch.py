import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from langserve import RemoteRunnable
import time 
import json
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003"],  # Allowing requests only from this origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Explicitly allowing OPTIONS method
    allow_headers=["*"],
)
# Get the remote runnable from the FastAPI server created in jockey.py
jockey = RemoteRunnable("http://localhost:8000/jockey")
# Guarantee unique session ID every time for testing
session_id = time.time()

def parse_langserve_events(event: dict, results: list):
    """Used to parse events emitted from Jockey when called as an API."""
    if event["event"] == "on_chat_model_stream":
        content = event["data"]["chunk"].content
        if content:
            print(f"{content}", end="", flush=True)
            # Attempts to maintain a consistent token rendering rate for a smoother UX

            time.sleep(0.05)
            results.append(content) 
    elif event["event"] == "on_tool_start":
        tool = event["name"]
        print(f"Running => {tool}", flush=True)
    elif event["event"] == "on_tool_end":
        tool = event["name"]
        print(f"Finished running {tool}", flush=True)

@app.post("/stream_events")
async def stream_events(request: Request):
    tool_names = ["video-search", "download-video", "combine-clips", "remove-segment"]
    request_data = await request.json()
    input_data = request_data.get("input")
    print("USER_INPUT", input_data)
    include_types = ["chat_model"]
    include_names = ["AzureChatOpenAI"] + tool_names

    async def generate_chunks():
        async for event in jockey.astream_events(
            {"input": input_data},
            {'configurable': {'session_id': session_id}},
            version="v1",
            include_types=include_types,
            include_names=include_names
        ):
            if event["event"] == "on_chat_model_start":
                if "input" in event["data"]:
                    if "messages" in event["data"]["input"]:
                        if event["data"]["input"]["messages"]:
                            if "content" in event["data"]["input"]["messages"][0][-1]:
                                messages = event["data"]["input"]["messages"][0][-1]["content"]
                                # textDataWhole = str(event["data"]["input"]["messages"][0][-1]["content"])
                                yield messages 

            if event["event"] == "on_chat_model_end":
                if "input" in event["data"]:
                    if "messages" in event["data"]["input"]:
                        if event["data"]["input"]["messages"]:
                            if "content" in event["data"]["input"]["messages"][0][-1]:
                                messages = event["data"]["input"]["messages"][0][-1]["content"]
                                # print(messages)
                                # mes = event["data"]["output"]["messages"][-1]
                                # print(mes)
                                # yield messages                 
            if event["event"] == "on_tool_start":
                tool = event["name"]
                toolsusign = f"Running => {tool}\n"
                yield  toolsusign
            if event["event"] == "on_tool_end":
                tool = event["name"]
                toolsusign = f"Finish => {tool}\n"
                yield  toolsusign
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content == 'final':
                    print(content)
                if content:
                    time.sleep(0.05)
                    yield content
    return StreamingResponse(generate_chunks())

if __name__ == "__main__":
    import uvicorn
    from fastapi.responses import StreamingResponse

    uvicorn.run(app, host="0.0.0.0", port=8080)
