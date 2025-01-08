import {ModalType, PanelVideos, type QuestionMessage} from '../../../types/messageTypes'

export enum ActionType {
	SET_SELECTED_FILE = 'SET_SELECTED_FILE',
	SET_RESPONSE_TEXT = 'SET_RESPONSE_TEXT',
	SET_INPUT_BOX = 'SET_INPUT_BOX',
	SET_LINK_URL = 'SET_LINK_URL',
	SET_LOADING = 'SET_LOADING',
	SET_ARRAY_MESSAGES = 'SET_ARRAY_MESSAGES',
	SET_SHOW_MODAL = 'SET_SHOW_MODAL',
	SET_ARRAY_MESSAGES_CLEAN = 'SET_ARRAY_MESSAGES_CLEAN',
	SET_SELECTED_FILE_DATA = 'SET_SELECTED_FILE_DATA',
	CHANGE_ARRAY_MESSAGE = 'CHANGE_ARRAY_MESSAGE',
	ADD_TOOLS_DATA_TO_LAST_ELEMENT = 'ADD_TOOLS_DATA_TO_LAST_ELEMENT',
	SET_STATUS_MESSAGES = 'SET_STATUS_MESSAGES',
	CLEAR_STATUS_MESSAGES = 'CLEAR_STATUS_MESSAGES',
	REMOVE_INITIAL_MESSAGE = 'REMOVE_INITIAL_MESSAGE',
	SET_CHOOSED_ELEMENT = 'SET_CHOOSED_ELEMENT',
	SET_AUTOFILL_API = 'SET_AUTOFILL_API',
	SET_SHOW_AUTOFILL_QUESTIONS = 'SET_SHOW_AUTOFILL_QUESTIONS',
	SET_PANEL_ARRAY_MESSAGES = 'SET_PANEL_ARRAY_MESSAGES',
	SET_MODAL_TYPE = 'SET_MODAL_TYPE',
	CLEAR_ALL_BUT_FIRST_ARRAY_MESSAGE = 'CLEAR_ALL_BUT_FIRST_ARRAY_MESSAGE',
	UPDATE_LAST_USER_MESSAGE = 'UPDATE_LAST_USER_MESSAGE',
	STREAM_TOKEN = 'STREAM_TOKEN',
	SET_LAST_AI_MESSAGE_STREAMING = 'SET_LAST_AI_MESSAGE_STREAMING',
	SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE',
}

export interface State {
	selectedFile: File | null | string | any
	selectedFileData: Object | null | any
	responseText: string | any
	inputBox: string
	linkUrl: string
	loading: boolean
	arrayMessages: QuestionMessage[]
	statusMessages: any[]
	showModal: boolean
	toolsData: any[]
	modalType: ModalType
	autofill: {
		choosedElement: [number, number]
		autofillApi: false
		showAutofillQuestions: false
	}
	panelVideosList: PanelVideos[]
	errorMessage: string
}

export type Action = {type: ActionType; payload: any}
