import { Client } from "@langchain/langgraph-sdk";
import { values } from "lodash";
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export const streamEvents = async (ActionType, dispatch, inputBox, setStreamData, arrayMessages) => {
  dispatch({ type: ActionType.SET_LOADING, payload: true })
  const client = new Client();
  console.log('here')
  const indexID = process.env.REACT_APP_API_INDEX_ID
  // List available assistants
  const assistants = await client.assistants.search();
  // console.log("List available assistants", assistants);
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
  // console.log("Get first assistant", assistant);
  console.log(assistant)
  // Create a new thread

  const thread = await client.threads.create();
  // console.log("Create new thread", thread);

  // If we list runs on this thread, we can see it is empty
  const runs = await client.runs.list(thread.thread_id);
  // Let's kick off a run
  // const input = {
  //   chat_history: [{ type:"user", content: `${indexID} ${inputBox}` }],
  // };
  let input = {
    chat_history: [{  type: "human", content: `66f1cde8163dbc55ba3bb220 Find a clip of ghosts appearing in the forest`  }],
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

  const inputs = { messages: [{ role: "human", content: "what's the weather in sf" }] };

  const messages = [{
    type: "human",
    content: "hello",
    name: "user"
  }];
  
  // Prepare input matching the Python structure
  const jockeyInput = {
    chat_history: messages,
    made_plan: false,
    next_worker: null,
    active_plan: null
  };

const state = await client.threads.getState(thread.thread_id);

// We now create the tool call with the id and the response we want
let lastMessage = state.values["feedback_history"]?.at(-1).feedback;
lastMessage =  [{
  feedback: "",
  node: "ask_human",
  node_content: "**video-search**: Search for 1 clip of ghosts appearing in the forest"
}]

// current_feedback_history: List[FeedbackEntry] = jockey.get_state(thread).values["feedback_history"]
// current_feedback_history[-1]["feedback"] = feedback_user_input
// await jockey.aupdate_state(thread, {"feedback_history": current_feedback_history})
console.log(lastMessage)
await client.threads.updateState(
  thread.thread_id,
  { values: { feedback_history: lastMessage } },
)

let feedback = {
  chat_history: [{  type: "human", content: `Move on`  }],
};

const streamResponses = client.runs.stream(
  thread.thread_id,
  assistant.assistant_id,
  {
    input: null,
    streamMode: "events"
  }
);

for await (const chunk of streamResponses) {
  console.log(chunk)
}

const threadHistory = await client.threads.getHistory(thread.thread_id, {
  limit: 100,
});




console.log("History ", threadHistory);




  }
