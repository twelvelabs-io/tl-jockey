import asyncio
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langserve import RemoteRunnable
import time 
import json
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allowing requests only from this origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Explicitly allowing OPTIONS method
    allow_headers=["*"],
)
# Get the remote runnable from the FastAPI server created in jockey.py
jockey = RemoteRunnable("https://fcc5-2600-8802-3911-f100-6468-462c-51cb-dd36.ngrok-free.app/jockey", headers={"Content-Type": "text/event-stream"})
# Guarantee unique session ID every time for testing
session_id = time.time()
port = int(os.environ.get("PORT", 8000))
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
    request._headers = {"Content-Type": "text/event-stream"}
    tool_names = ["video-search", "download-video", "combine-clips", "remove-segment"]
    request_data = await request.json()
    input_data = request_data.get("input")
    print("USER_INPUT", input_data)
    include_types = ["chat_model"]
    include_names = ["AzureChatOpenAI"] + tool_names
    if not input_data:
        raise HTTPException(status_code=400, detail="Input data is missing")
    
    async def generate_chunks():
            async for event in jockey.astream_events(
                {"input": input_data},
                {'configurable': {'session_id': session_id}},
                version="v1",
                include_types=include_types,
                include_names=include_names
            ):
                print("EVENT", event)
                if event["event"] == "on_chat_model_start":
                    if "input" in event["data"]:
                        if "messages" in event["data"]["input"]:
                            if event["data"]["input"]["messages"]:
                                if "content" in event["data"]["input"]["messages"][0][-1]:
                                    messages = event["data"]["input"]["messages"][0][-1]["content"]
                                    # textDataWhole = str(event["data"]["input"]["messages"][0][-1]["content"])
                                    yield messages 

                # if event["event"] == "on_chat_model_end":
                #     if "input" in event["data"]:
                #         if "messages" in event["data"]["input"]:
                #             if event["data"]["input"]["messages"]:
                #                 if "content" in event["data"]["input"]["messages"][0][-1]:
                #                     messages = event["data"]["input"]["messages"][0][-1]["content"]
                #                     # print(messages)
                #                     # outputText = event["data"]["output"]
                #                     # mes = event["data"]["output"]["messages"][-1]
                #                     # print(mes)
                #                     # yield outputText    
                #                     # yield messages             
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
    return StreamingResponse(generate_chunks(), media_type="text/event-stream", headers={"Content-Type": "text/event-stream"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
