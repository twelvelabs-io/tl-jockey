import { Client } from "@langchain/langgraph-sdk";
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export const streamEvents = async (ActionType, dispatch, inputBox, setStreamData, arrayMessages) => {
  dispatch({ type: ActionType.SET_LOADING, payload: true })
  const client = new Client();
  const indexID = process.env.REACT_APP_API_INDEX_ID
  // List available assistants
  const assistants = await client.assistants.search();
  console.log("List available assistants", assistants);
  function formatToolCalls(toolCalls) {
    if (toolCalls && toolCalls.length > 0) {
      console.log(toolCalls)
      const formattedCalls = toolCalls.map(
        (call) =>
            call.name
      );
      return formattedCalls.join("\n");
    }
    return "No tool calls";
  }
  // Get the first assistant, we will use this one
  const assistant = assistants[0];
  console.log("Get first assistant", assistant);

  // Create a new thread
  const thread = await client.threads.create();
  console.log("Create new thread", thread);

  // If we list runs on this thread, we can see it is empty
  const runs = await client.runs.list(thread.thread_id);
  // Let's kick off a run
  const input = {
    chat_history: [{ type:"user", content: `${indexID} ${inputBox}` }],
  };



  dispatch({
    type: ActionType.SET_ARRAY_MESSAGES,
    payload: [
      {
        sender: 'ai',
        text: '',
        link: '',
        linkText: '',
        twelveText: '',
        asrTest: '',
        lameText: '',
        question: ''
      }
    ]
  })

  for await (const event of client.runs.stream(
    thread.thread_id,
    assistant.assistant_id,
    { input, streamMode: "messages" }
  )) {

    console.log(event)
    if (event.event === "metadata") {
      const data = event.data
      console.log(`Metadata: Run ID - ${data["run_id"]}`);
    } else if (event.event === "on_tool_start") {
      console.log("START X")
     }
    
    
    else if (event.event === "messages/partial") {
      for (const dataItem of event?.data) {
        if ("role" in dataItem && dataItem.role === "user") {
          console.log(`Human: ${dataItem.content}`);
        } else {
          const content = dataItem.content || "";
          const responseMetadata = dataItem.response_metadata || {};

          if (content) {
            console.log(`AI: ${content}`);
          }

          if (responseMetadata) {
            const finishReason = responseMetadata.finish_reason || "N/A";
            console.log(`Response Metadata: Finish Reason - ${finishReason}`);
            let threadState = await client.threads.getState(thread.thread_id);
            if (finishReason === 'stop') {
              let agentName = threadState.next[0]
              dispatch({
                type: ActionType.SET_ARRAY_MESSAGES,
                payload: [
                  {
                    sender: 'ai',
                    text: content,
                    link: '',
                    linkText: agentName,
                    twelveText: content,
                    asrTest: '',
                    lameText: '',
                    question: inputBox
                  }
                ]
              })
            }
          }
        }
      }
      console.log("-".repeat(50));
    }
      dispatch({
        type: ActionType.CLEAR_STATUS_MESSAGES,
        payload: [],
      });
  }

}





