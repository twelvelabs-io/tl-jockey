## Optimizations

### `video_search`

- Used `asyncio.gather` to get video metadata for each video ID in parallel, instead of sequentially

### `download_video`

- Was the most time consuming as each video was being download sequentially.
- Changed `download_video` to an async function that downloads with `ffmpeg` `run_async`.

### LangGraph Experimentation

- Currently, there is one main agent that makes decisions and routes to different functions.

![Agent Image](/jockey/assets/images/agent.png)

- Limited to token length, number of tools, prompt sizes, llm, etc. Time-consuming.
- LangGraph allows for a more fine tuned orchestration of multiple agents, see here: `jockey/jockey_graph.py`.
- Did not finish implementing it yet, but found it interesting.

![Agent 2 Image](/jockey/assets/images/agent2.png)

### Streaming Agent Output

- Removed `TokenByTokenHandler` and streamed agent's output with `astream`.

## Results Over 3 Trials Each

### Prompt: Find Me Logos

- **Video Search**
  - Old Time: 4.74 seconds
  - New Time: 1.60 seconds
- **Download Videos**
  - Old Time: 12.76 seconds
  - New Time: 8.09 seconds
- **Total Time Reduction:** 7.81 seconds.
- **Percentage Improvement:** 44.63%

### Prompt: Find Me Humans

- **Video Search**
  - Old Time: 4.82 seconds
  - New Time: 1.88 seconds
- **Download Videos**
  - Old Time: 13.76 seconds
  - New Time: 9.58 seconds
- **Total Time Reduction:** 7.12 seconds.
- **Percentage Improvement:** 38.32%

### Avg Improvements in functions

- **Time Reduction:** 7.465 seconds
- **Percentage Improvement:** 41.48%

### Improvements in agent run for the prompt `compile all logos from [index-id]`

- **Old Time:** 126.81 seconds
- **New Time:** 56.05 seconds
- **Percentage Improvement:** 55.80%
