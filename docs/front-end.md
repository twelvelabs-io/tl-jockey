
# Integrate Jockey with Your Front-end Application 

This guide shows how to integrate Jockey with your front-end application using the LangChain SDK.

## Prerequisites

- [Node.js](https://nodejs.org/en) is already installed on your computer.
- You already have a running instance of Jockey.
- Familiarity with the [LangGraph JS SDK](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/).

## Installation

Install the LangGraph SDK:
```bash
npm install @langchain/langgraph-sdk # yarn add @langchain/langgraph-sdk
```

## Basic Setup

1. Import the LangGraph client into your application:
    ```js
    import { Client } from "@langchain/langgraph-sdk"
    ```
2. Initialize the client, replacing the placeholder surrounded by "<>" with the URL of your Jockey instance:
    ```js
    const client = new Client({apiUrl: "<JOCKEY_INSTANCE_URL>"});
    ```

3. Connect to an existing Jockey assistant:
    ```js
    const assistants = await client.assistants.search()
    const assistant = assistants[0]
    ```
## Message Structure

Messages sent to Jockey must follow a specific format that combines the unique identifier of an index with the user's message:

```js
const input = {
    chat_history: [{
        type: "user",           // Message sender type
        content: `${indexID} ${userMessage}`  // Index ID and message content
    }]
}
```

Example:

```js
const input = {
    chat_history: [{
        type: "user",
        content: "659f2e829aba4f0b402f6488 Find the top clip of a touchdown"
    }]
}
```

## Streaming Modes

Jockey supports three streaming modes, each suited for different use cases:

- **Messages mode**: This mode is best suited for chat applications. It streams both complete messages and tokens generated within nodes.
- **Values mode**: This mode streams the complete state after each node execution.
- **Updates mode**: This mode streams state changes after each node execution.

The following example uses the updates mode. It sets the value of the `streamMode` parameter to `updates`:
    
```js
for await (const event of client.runs.stream(
    thread.thread_id,
    assistant.assistant_id,
    { input, streamMode: "updates" }
)) {
    console.log(`Receiving new event of type: ${event.event}...`);
    console.log(JSON.stringify(event.data));
    console.log("\n\n");
}
```

## Handling Multiple Tasks

When starting a new task while another is in progress, use the `multitaskStrategy` parameter to specify a multitask strategy. The following strategies are available:
- `reject`: Rejects new runs while one is in progress. In the example below, the second run will be rejected when called.
    ```js
    // REJECT
    console.log("\nREJECT demo\n");
    let thread = await client.threads.create();
    let run = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in SF?" }],
        },
        },
    );

    // attempt a new run (will be rejected)
    await client.runs.create(thread["thread_id"], assistant["assistant_id"], {
        input: {
        messages: [{ role: "human", content: "What is the weather in NYC?" }],
        },
        multitaskStrategy: "reject",
    });

    await client.runs.join(thread["thread_id"], run["run_id"]);

    // We can verify that the original thread finished executing:
    let state = await client.threads.getState(thread["thread_id"]);
    console.log("Messages", state["values"]["messages"]);
    ```
- `interrupt`: Stops current run and starts the new one. In the example below the result will be partial from the first run and complete from the second. The result will be partial from the first run and complete from the second.
    ```js
    // INTERRUPT
    console.log("\nINTERRUPT demo\n");
    thread = await client.threads.create();
    const interruptedRun = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in SF?" }],
        },
        },
    );
    await sleep(2000);
    run = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in NYC?" }],
        },
        multitaskStrategy: "interrupt",
        },
    );
    await client.runs.join(thread["thread_id"], run["run_id"]);

    // We can see that the thread has partial data from the first run + data from the second run
    state = await client.threads.getState(thread["thread_id"]);
    console.log("Messages", state["values"]["messages"]);

    // Verify that the original, canceled run was interrupted
    console.log(
        "Interrupted run status",
        (await client.runs.get(thread["thread_id"], interruptedRun["run_id"]))[
        "status"
        ],
    );
    ```
- `rollback`: Cancels the current run, reverts the state, then starts a new run. In the example below, when the second run starts, it will roll back all of the current state and then run again with the second run data. Only the result from the second run will be available.
    ```js
    // ROLLBACK
    console.log("\nROLLBACK demo\n");
    thread = await client.threads.create();
    const rolledBackRun = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in SF?" }],
        },
        },
    );
    await sleep(2000);
    run = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in NYC?" }],
        },
        multitaskStrategy: "rollback",
        },
    );

    await client.runs.join(thread["thread_id"], run["run_id"]);

    // We can see that the thread only has data from the second run
    state = await client.threads.getState(thread["thread_id"]);
    console.log("Messages", state["values"]["messages"]);

    // Verify that the original, rolled back run was deleted
    try {
        await client.runs.get(thread["thread_id"], rolledBackRun["run_id"]);
    } catch (e) {
        console.log("Original run was deleted", e);
    }
    ```
- `enqueue`: Queues the new run to start after the current run completes. In the example below, the second run will wait until the first run finishes and then run The results from both runs will be available.
    Example:
    ```js
    // ENQUEUE
    console.log("\nENQUEUE demo\n");
    thread = await client.threads.create();
    await client.runs.create(thread["thread_id"], assistant["assistant_id"], {
        input: {
        messages: [{ role: "human", content: "What is the weather in SF?" }],
        sleep: 5,
        },
    });
    await sleep(500);
    const secondRun = await client.runs.create(
        thread["thread_id"],
        assistant["assistant_id"],
        {
        input: {
            messages: [{ role: "human", content: "What is the weather in NYC?" }],
        },
        multitaskStrategy: "enqueue",
        },
    );
    await client.runs.join(thread["thread_id"], secondRun["run_id"]);

    // Verify that the thread has data from both runs
    state = await client.threads.getState(thread["thread_id"]);
    console.log("Combined messages", state["values"]["messages"]);
    }

    main();
    ```

## Working with Event Data

Jockey streams data through events, which contain both message content and metadata. Understanding these events is essential for implementing features like real-time chat updates and progress indicators  in your application.

### Understanding Event Structure

Jockey uses a nested structure for events. At the top level, each event contains an event type and an array of data objects. Within the data array, individual message objects contain the actual content and metadata for each response:

```JSON
{
  "event": "messages/partial",
  "data": [
    {
      "additional_kwargs": {},
      "function_call": {
        "arguments": "{\"next_worker\":\"planner\"}",
        "name": "route"
      },
      "content": "",
      "example": false,
      "id": "run-f2485abe-cf40-4172-b501-13f3e674a6f2",
      "invalid_tool_calls": [],
      "name": null,
      "response_metadata": {
        "finish_reason": "stop"
      },
      "tool_calls": [],
      "type": "ai",
      "usage_metadata": null
    }
  ]
}
```


### Retrieve the Next Agent

To retrieve the next agent in the processing chain:

```js
// Get thread state
const threadState = await client.threads.getState(thread.thread_id)

// Access next agent name
const nextAgentName = threadState.next[0]
```

### Processing Message Content

To handle streaming content in your application:

```js
for await (const event of client.runs.stream(thread.thread_id, assistant.assistant_id, options)) {
    if (event.event === "messages/partial") {
        for (const message of event.data) {
            if (message.content) {
                // Display or process partial message content
                console.log(message.content)
            }
        }
    }
}
```

### Detecting Stream Completions

The stream is considered complete when a data item contains `response_metadata.finish_reason === 'stop'`.

```js
for await (const event of client.runs.stream(thread.thread_id, assistant.assistant_id, options)) {
    if (event.event === "messages/partial") {
        for (const dataItem of event.data) {
            // Check if stream is complete
            if (dataItem.response_metadata?.finish_reason === 'stop') {
                // Handle stream completion
            }
            
            // Process message content
            if (dataItem.content) {
                // Handle message content
            }
        }
    }
}
```
