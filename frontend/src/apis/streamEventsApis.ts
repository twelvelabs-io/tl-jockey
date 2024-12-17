import {Client, ThreadState} from '@langchain/langgraph-sdk'
import {BaseMessage, HumanMessage, MessageFieldWithRole, ToolMessage} from '@langchain/core/messages'
import _ from 'lodash'
import process from 'process'
import fs from 'fs'
import {StreamEvent} from '@langchain/core/dist/tracers/event_stream'
interface Clip {
	score: number
	start: number
	end: number
	metadata: Array<{type: string; text?: string}>
	video_id: string
	confidence: string
	thumbnail_url: string
	modules?: Array<{type: string; confidence: string}>
	video_url: string
	video_title: string
}

interface PlannerResponse {
	route_to_node: 'planner' | 'video-search' | 'video-text-generation' | 'video-editing' | 'reflect'
	tool_call: 'simple-video-search' | 'combine-clips' | 'none'
	plan: string
	index_id: string
	clip_keys: string[]
}

// same as backend's PlannerResponse type
interface VideoSearchInput {
	query: string
	index_id: string
	top_n: number
	group_by: string
	search_options: Array<'visual' | 'conversation' | 'text_in_video' | 'logo'>
	video_filter: string | null
}

interface JockeyState {
	[key: string]: any // Add this line
	next_worker: string | null
	chat_history: BaseMessage[] | BaseMessage | MessageFieldWithRole[] | MessageFieldWithRole //see  python's Annotated[Sequence[BaseMessage], add_messages]
	made_plan: boolean
	active_plan: string | BaseMessage | null
	clips_from_search: Record<string, Clip[]>
	relevant_clip_keys: string[]
	tool_call: string | null
	index_id: string
}

export const streamEvents = async (ActionType: any, dispatch: any, inputBox: any, setStreamData: any, arrayMessages: any, setInputBoxColor: any) => {
	dispatch({type: ActionType.SET_LOADING, payload: true})

	const client = new Client({apiUrl: process.env.REACT_APP_LANGGRAPH_API_URL})
	const assistants = await client.assistants.search()
	const assistant = assistants[0]
	const thread = await client.threads.create()
	// const indexID = process.env.REACT_APP_API_INDEX_ID
	// const runs = await client.runs.list(thread.thread_id)

	const initJockeyInput: JockeyState = {
		chat_history: [
			{
				role: 'human',
				name: 'user',
				content: `${inputBox} in the index 670514a1e5620307b898b0c5`,
			},
		],
		made_plan: false,
		next_worker: null,
		active_plan: null,
		clips_from_search: {} as Record<string, Clip[]>,
		relevant_clip_keys: [] as string[],
		tool_call: null,
		index_id: null,
	}

	function parseSearchResults(rawData: StreamEvent) {
		const output = rawData.data.output
		const parsedOutput = JSON.parse(output) as Clip[]

		// const toolMessage = new ToolMessage({
		// 	content: JSON.stringify(output.clips_from_search),
		// 	tool_call_id: latestChatId,
		// 	name: 'video-search',
		// 	additional_kwargs: {videoResults: clips},
		// })
		// // set the array messages
		// dispatch({
		// 	type: ActionType.SET_ARRAY_MESSAGES,
		// 	payload: [
		// 		{
		// 			sender: 'ai',
		// 			text: toolMessage.content,
		// 			linkText: 'details',
		// 			link: '', // set this in "events"
		// 			twelveText: toolMessage.content,
		// 			asrTest: '',
		// 			lameText: '',
		// 			question: inputBox,
		// 			toolsData: toolMessage.additional_kwargs.videoResults,
		// 		},
		// 	],
		// })

		// // set loading to false
		// dispatch({
		// 	type: ActionType.SET_LOADING,
		// 	payload: false,
		// })
	}

	function parseSearchParams(rawData: StreamEvent) {
		const input = rawData.data.input as VideoSearchInput

		try {
			dispatch({
				type: ActionType.UPDATE_LAST_USER_MESSAGE,
				payload: {
					asrTest: input.query,
				},
			})
		} catch (error) {
			console.error('Error decoding JSON:', error)
			return new ToolMessage({
				content: 'Error parsing content',
				tool_call_id: 'error',
				name: 'error',
				additional_kwargs: {},
			})
		}
	}

	const processStream = async (input: JockeyState) => {
		let accumulatedTokens = ''

		for await (const chunk of client.runs.stream(thread.thread_id, assistant.assistant_id, {
			input: input as JockeyState,
			streamMode: ['updates', 'events'],
		})) {
			// console.log(JSON.stringify(chunk, null, 2))
			// parse static updates
			if (chunk.data.event === 'on_tool_start') parseSearchParams(chunk.data as StreamEvent)
			if (chunk.data.event === 'on_tool_end') parseSearchResults(chunk.data as StreamEvent)

			// parse streaming updates
			if (chunk.event === 'events') {
				if (chunk.data?.metadata?.langgraph_node === 'reflect' && chunk.data.event === 'on_chat_model_stream') {
					const token = chunk.data?.data?.chunk?.content
					console.log('token:', token)
					// TODO: stream token back to the frontend, and handle token states
					// dispatch({type: ActionType.SET_ARRAY_MESSAGES, payload: [{sender: 'ai', text: token, question: inputBox}]})
					// const summary = 'summary'
					// if (cleanedJson) {
					// 	dispatch({
					// 		type: ActionType.SET_ARRAY_MESSAGES,
					// 		payload: [
					// 			{
					// 				sender: 'ai',
					// 				text: cleanedJson.content,
					// 				link: summary,
					// 				linkText: 'details',
					// 				twelveText: cleanedJson.content,
					// 				asrTest: '',
					// 				lameText: '',
					// 				question: inputBox,
					// 				toolsData: cleanedJson.additional_kwargs.videoResults,
					// 			},
					// 		],
					// 	})
					// 	dispatch({
					// 		type: ActionType.SET_LOADING,
					// 		payload: false,
					// 	})
					// }
				}
			}
		}
	}

	setInputBoxColor('#D4D5D2')
	// TODO: do we need to pass a trycatch here to handle errors/interrupts?
	await processStream(initJockeyInput) // initial
	dispatch({
		type: ActionType.CLEAR_STATUS_MESSAGES,
		payload: [],
	})
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
