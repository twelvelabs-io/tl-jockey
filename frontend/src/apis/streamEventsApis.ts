import {StreamEvent} from '@langchain/core/dist/tracers/event_stream'
import {parseSearchResults, parseSearchParams, handleReflectEvents, handleStreamError} from './helpersStream/helpersStream'
import {client, initialize} from './initConfig'
import {BaseMessage} from '@langchain/core/messages'
import {MessageFieldWithRole} from '@langchain/core/messages'

// todo: get index id from the user or load default ones from the server
const indexId = process.env.REACT_APP_INDEX

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
	clip_url: string // this is the signed url to the trimmed clip stored in the s3 bucket
	clip_id: string
}

export interface PlannerResponse {
	route_to_node: 'planner' | 'video-search' | 'video-text-generation' | 'video-editing' | 'reflect'
	tool_call: 'simple-video-search' | 'combine-clips' | 'none'
	plan: string
	index_id: string
	clip_keys: string[]
}

export interface VideoSearchInput {
	query: string
	index_id: string
	top_n: number
	group_by: string
	search_options: Array<'visual' | 'conversation' | 'text_in_video' | 'logo'>
	video_filter: string | null
}

export interface JockeyState {
	[key: string]: any
	next_worker: string | null
	chat_history: BaseMessage[] | BaseMessage | MessageFieldWithRole[] | MessageFieldWithRole
	made_plan: boolean
	active_plan: string | BaseMessage | null
	clips_from_search: Record<string, Clip[]>
	relevant_clip_keys: string[]
	tool_call: string | null
	index_id: string | null
}

export const streamEvents = async (ActionType: any, dispatch: any, inputBox: any, setStreamData: any, arrayMessages: any, setInputBoxColor: any) => {
	dispatch({type: ActionType.SET_LOADING, payload: true})
	const {assistant, thread} = await initialize()

	const initJockeyInput: JockeyState = {
		chat_history: [
			{
				role: 'human',
				name: 'user',
				content: inputBox,
			},
		],
		made_plan: false,
		next_worker: null,
		active_plan: null,
		clips_from_search: {} as Record<string, Clip[]>,
		relevant_clip_keys: [] as string[],
		tool_call: null,
		index_id: indexId,
	}

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
