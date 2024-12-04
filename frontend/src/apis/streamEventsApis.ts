import { Client, ThreadState } from "@langchain/langgraph-sdk"
import { BaseMessage, HumanMessage, MessageFieldWithRole } from "@langchain/core/messages"
import _ from "lodash"

interface FeedbackEntry {
	node_content: string
	node: string
	feedback: string
}

interface JockeyState {
	next_worker: string | null
	chat_history: BaseMessage[] | BaseMessage | MessageFieldWithRole[] | MessageFieldWithRole //see  python's Annotated[Sequence[BaseMessage], add_messages]
	made_plan: boolean
	active_plan: string | BaseMessage | null
	feedback_history: FeedbackEntry[]
}

export const streamEvents = async (ActionType: any, dispatch: any, inputBox: any, setStreamData: any, arrayMessages: any) => {
	dispatch({ type: ActionType.SET_LOADING, payload: true })

	const client = new Client({
		apiUrl: process.env.REACT_APP_LANGGRAPH_API_URL,
	})
	const indexID = process.env.REACT_APP_API_INDEX_ID
	const assistants = await client.assistants.search()
	const assistant = assistants[0]
	const thread = await client.threads.create()
	const runs = await client.runs.list(thread.thread_id)

	const jockeyInput: JockeyState = {
		next_worker: null,
		chat_history: [
			{
				role: "human",
				name: "user",
				content: "find 2 dunking videos in the index 670514a1e5620307b898b0c5",
			},
		],
		made_plan: false,
		active_plan: null,
		feedback_history: [],
	}

	const processStream = async (input: JockeyState | null) => {
		for await (const chunk of client.runs.stream(thread.thread_id, assistant.assistant_id, {
			input: input as any,
			streamMode: "updates",
			interruptBefore: ["ask_human"],
		})) {
			console.log(JSON.stringify(chunk.data), "\n")
		}
	}

	const handleFeedback = async () => {
		// TODO: fix this part
		const feedback = prompt("Enter your feedback:") ?? ""

		try {
			const state = await client.threads.getState(thread.thread_id)
			const feedbackHistory = (state.values as { feedback_history: FeedbackEntry[] }).feedback_history
			const updatedHistory = [...feedbackHistory.slice(0, -1), { ...feedbackHistory[feedbackHistory.length - 1], feedback }]
			await client.threads.updateState(thread.thread_id, {
				values: { feedback_history: updatedHistory },
			})
		} catch (error) {
			console.error("Error updating feedback:", error)
		}
	}

	await processStream(jockeyInput) // initial
	while (true) {
    // break if we encounter reflect
		const state = await client.threads.getState(thread.thread_id)
		if ((state.values as { next_worker: string }).next_worker === "reflect") break

		await handleFeedback()
		await processStream(null)
	}
}

//   dispatch({
//     type: ActionType.SET_ARRAY_MESSAGES,
//     payload: [
//       {
//         sender: "ai",
//         text: "",
//         link: "",
//         linkText: "",
//         twelveText: "",
//         asrTest: "",
//         lameText: "",
//         question: "",
//       },
//     ],
//   });
// };

// get the state of the thread

//   let storedAgentName = ''

//   function extractAgentName(str) {
//     const match = str.match(/"next_worker"\s*:\s*"([^"]+)"/);
//     return match ? match[1] : '';
//   }

//   for await (const event of client.runs.stream(
//     thread.thread_id,
//     assistant.assistant_id,
//     { input, streamMode: "messages" }
//   )) {

//     if (event.event === "metadata") {
//       const data = event.data
//     } else if (event.event === "on_tool_start") {
//       console.log("START X")
//      }

//     else if (event.event === "messages/partial") {
//       for (const dataItem of event?.data) {
//         if ("role" in dataItem && dataItem.role === "user") {
//           console.log(`Human: ${dataItem.content}`);
//         } else {
//           const content = dataItem.content || "";
//           const responseMetadata = dataItem.response_metadata || {};

//           if (responseMetadata) {
//             try {
//               const functionCallArgs = dataItem.additional_kwargs?.function_call?.arguments || '';
//               const currentAgentName = extractAgentName(functionCallArgs);
//               if (currentAgentName) {
//                 storedAgentName = currentAgentName;
//               }
//             } catch (error) {
//               console.error("Error with function arguments:", error);
//             }

//             const finishReason = responseMetadata.finish_reason || "N/A";
//             console.log(`Response Metadata: Finish Reason - ${finishReason}`);
//             // let threadState = await client.threads.getState(thread.thread_id);
//             if (finishReason === 'stop') {
//               // let agentName = threadState.next[0]
//               dispatch({
//                 type: ActionType.SET_ARRAY_MESSAGES,
//                 payload: [
//                   {
//                     sender: 'ai',
//                     text: content,
//                     link: '',
//                     linkText: storedAgentName,
//                     twelveText: content,
//                     asrTest: '',
//                     lameText: '',
//                     question: inputBox
//                   }
//                 ]
//               })
//             }
//           }
//         }
//       }
//       console.log("-".repeat(50));
//     }
//       dispatch({
//         type: ActionType.CLEAR_STATUS_MESSAGES,
//         payload: [],
//       });
//   }

// }
