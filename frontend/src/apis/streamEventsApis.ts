import {StreamEvent} from '@langchain/core/dist/tracers/event_stream'
import {parseSearchResults, parseSearchParams, handleReflectEvents, handleStreamError} from './helpersStream/helpersStream'
import {client, initialize, initJockeyInput} from './initConfig'
import {BaseMessage} from '@langchain/core/messages'

export interface Clip {
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

export interface JockeyState {
	[key: string]: any
	next_worker: string | null
	chat_history: any
	made_plan: boolean
	active_plan: string | BaseMessage | null
	clips_from_search: Record<string, Clip[]>
	relevant_clip_keys: string[]
	tool_call: string | null
	index_id: string
}

export const streamEvents = async (ActionType: any, dispatch: any, inputBox: any, setStreamData: any, arrayMessages: any, setInputBoxColor: any) => {
	dispatch({type: ActionType.SET_LOADING, payload: true})

	const {assistant, thread} = await initialize(inputBox)

	const processStream = async (input: JockeyState) => {
		try {
			for await (const chunk of client.runs.stream(thread.thread_id, assistant.assistant_id, {
				input: input as JockeyState,
				streamMode: ['updates', 'events'],
			})) {
				const {event, data} = chunk
				const {event: dataEvent, metadata, data: chunkData} = data || {}

				if (dataEvent === 'on_tool_start') {
					parseSearchParams(data as StreamEvent, dispatch)
				} else if (dataEvent === 'on_tool_end') {
					parseSearchResults(data as StreamEvent, dispatch, inputBox)
				} else if (event === 'events' && metadata?.langgraph_node === 'reflect') {
					handleReflectEvents(dataEvent, chunkData, dispatch, inputBox)
				}
			}
		} catch (error) {
			handleStreamError(dispatch, ActionType, error)
		}
	}

	setInputBoxColor('#D4D5D2')
	await processStream(initJockeyInput)
	dispatch({
		type: ActionType.CLEAR_STATUS_MESSAGES,
		payload: [],
	})
}
