import {Client, ThreadState} from '@langchain/langgraph-sdk'
import {BaseMessage, HumanMessage, MessageFieldWithRole, ToolMessage} from '@langchain/core/messages'
import _ from 'lodash'
import process from 'process'
import { getOpenAISummary } from './hooks'
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface FeedbackEntry {
	node_content: string
	node: string
	feedback: string
}

interface VideoSearchResult {
	score: number;
	start: number;
	end: number;
	metadata: Array<{
	  type: string;
	  text?: string;
	}>;
	video_id: string;
	confidence: string;
	thumbnail_url: string;
	modules: Array<{
	  type: string;
	  confidence: string;
	}>;
	video_url: string;
	video_title: string;
  }

  interface ToolCallOutput {
	name: string;
	args: {
	  query: string;
	  index_id: string;
	  top_n: number;
	  group_by: string;
	  search_options: string[];
	};
	id: string;
	type: string;
	output: string; 
  }

interface JockeyState {
	next_worker: string | null
	chat_history: BaseMessage[] | BaseMessage | MessageFieldWithRole[] | MessageFieldWithRole //see  python's Annotated[Sequence[BaseMessage], add_messages]
	made_plan: boolean
	active_plan: string | BaseMessage | null
	feedback_history: FeedbackEntry[]
}

export const streamEvents = async (ActionType: any, dispatch: any, inputBox: any, setStreamData: any, arrayMessages: any, setInputBoxColor: any) => {
	dispatch({type: ActionType.SET_LOADING, payload: true})

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
				role: 'human',
				name: 'user',
				content: `${inputBox} in the index 670514a1e5620307b898b0c5`,
			},
		],
		made_plan: false,
		active_plan: null,
		feedback_history: [],
	}

	function parseJsonString(jsonString: any): ToolMessage {
		try {
		  const jsonObject = JSON.parse(jsonString);
		  const contentArray = JSON.parse(jsonObject.content) as ToolCallOutput[];
		  const videoResults = JSON.parse(contentArray[0].output) as VideoSearchResult[];
		  
		  return new ToolMessage({
			content: JSON.stringify(videoResults),
			tool_call_id: jsonObject.id,
			name: jsonObject.name,
			additional_kwargs: {
			  videoResults: videoResults
			}
		  });
		} catch (error) {
		  console.error("Error decoding JSON:", error);
		  return new ToolMessage({
			content: "Error parsing content",
			tool_call_id: "error",
			name: "error",
			additional_kwargs: {}
		  });
		}
	  }

	  function parseThinkingAction(jsonString: any) {
		try {
		  const jsonObject = JSON.parse(jsonString);
		  const contentArray = JSON.parse(jsonObject.content) as ToolCallOutput[];
		  const query = contentArray[0].args.query;
		  console.log("Thinking action:", query);
		  
		  dispatch({
			type: ActionType.UPDATE_LAST_USER_MESSAGE,
			payload: {
			  asrTest: query
			}
		  });

		} catch (error) {
		  console.error("Error decoding JSON:", error);
		  return new ToolMessage({
			content: "Error parsing content",
			tool_call_id: "error",
			name: "error",
			additional_kwargs: {}
		  });
		}
	  }

	const processStream = async (input: JockeyState | null) => {
		let accumulatedTokens = ''

		for await (const chunk of client.runs.stream(thread.thread_id, assistant.assistant_id, {
			input: input as any,
			streamMode: ['updates', 'events'],
			interruptBefore: ['ask_human'],
		})) {
			if (chunk.event === 'updates') {
				// console.log("chunk.data:", chunk.data)
				const videoSearchData = chunk.data["video-search"];
				if (videoSearchData && videoSearchData["chat_history"]) {
					const contentArray = videoSearchData["chat_history"];
					const content = JSON.stringify(contentArray[contentArray.length - 1]);
					const cleanedJson = parseJsonString(content);
					console.log("cleanedJson:", cleanedJson);
					const summary = await getOpenAISummary(cleanedJson.content);
					if (cleanedJson) {
						dispatch({
							type: ActionType.SET_ARRAY_MESSAGES,
							payload: [
								{
									sender: 'ai',
									text: cleanedJson.content,
									link: summary,
									linkText: "details",
									twelveText: cleanedJson.content,
									asrTest: '',
									lameText: '',
									question: inputBox,
									toolsData: cleanedJson.additional_kwargs.videoResults
								}
							]
						});
						dispatch({
							type: ActionType.SET_LOADING,
							payload: false
						});
					}
				} else {
					console.error("video-search data or chat_history is undefined");
				}
			}
			if (chunk.event === 'events') {
				if (chunk.data?.data?.output?.chat_history) {
					try {
						const contentArray = chunk.data?.data?.output["chat_history"];
						const content = JSON.stringify(contentArray[contentArray.length - 1]);
						parseThinkingAction(content);
					} catch (error) {
						console.error("Error parsing event content:", error);
					}
				}
			}
		}
	}

	const handleFeedback = async () => {
		// const feedback = prompt('Enter your feedback:') ?? ''
		setInputBoxColor('red')
		const feedback = inputBox

		try {
			const state = await client.threads.getState(thread.thread_id)
			const feedbackHistory = (state.values as {feedback_history: FeedbackEntry[]}).feedback_history
			const updatedHistory = [...feedbackHistory.slice(0, -1), {...feedbackHistory[feedbackHistory.length - 1], feedback}]
			await client.threads.updateState(thread.thread_id, {
				values: {feedback_history: updatedHistory},
			})
		} catch (error) {
			console.error('Error updating feedback:', error)
		}
	}
	setInputBoxColor('#D4D5D2')
	await processStream(jockeyInput) // initial
	while (true) {
		// break if we encounter reflect
		const state = await client.threads.getState(thread.thread_id)
		if ((state.values as {next_worker: string}).next_worker === 'video-search') break

		await handleFeedback()
		await processStream(null)
	}
	    dispatch({
        type: ActionType.CLEAR_STATUS_MESSAGES,
        payload: [],
      });
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
