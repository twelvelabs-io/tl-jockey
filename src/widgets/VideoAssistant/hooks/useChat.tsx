import { useReducer } from 'react'
import { type Message } from '../VideoAssistant'

enum ActionType {
  SET_SELECTED_FILE = 'SET_SELECTED_FILE',
  SET_RESPONSE_TEXT = 'SET_RESPONSE_TEXT',
  SET_INPUT_BOX = 'SET_INPUT_BOX',
  SET_LINK_URL = 'SET_LINK_URL',
  SET_LOADING = 'SET_LOADING',
  SET_ARRAY_MESSAGES = 'SET_ARRAY_MESSAGES',
  SET_SHOW_MODAL = 'SET_SHOW_MODAL',
  SET_ARRAY_MESSAGES_CLEAN = 'SET_ARRAY_MESSAGES_CLEAN',
  SET_SELECTED_FILE_DATA = 'SET_SELECTED_FILE_DATA'
}

export interface State {
  selectedFile: File | null | string | any
  selectedFileData: Object | null | any
  responseText: string | any
  inputBox: string
  linkUrl: string
  loading: boolean
  arrayMessages: Message[]
  showModal: boolean
}

type Action =
  | { type: ActionType, payload: any }

const initialState: State = {
  selectedFile: null,
  selectedFileData: null,
  responseText: '',
  inputBox: '',
  linkUrl: '',
  loading: false,
  arrayMessages: [],
  showModal: false
}

function reducer (state: State, action: Action): State {
  switch (action.type) {
    case ActionType.SET_SELECTED_FILE:
      return { ...state, selectedFile: action.payload }
    case ActionType.SET_SELECTED_FILE_DATA:
        return { ...state, selectedFileData: action.payload }
    case ActionType.SET_RESPONSE_TEXT:
      return { ...state, responseText: action.payload }
    case ActionType.SET_INPUT_BOX:
      return { ...state, inputBox: action.payload }
    case ActionType.SET_LINK_URL:
      return { ...state, linkUrl: action.payload }
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload }
    case ActionType.SET_ARRAY_MESSAGES:
      return { ...state, arrayMessages: [...state.arrayMessages, ...action.payload] }
    case ActionType.SET_ARRAY_MESSAGES_CLEAN:
      return { ...state, arrayMessages: [] }
    case ActionType.SET_SHOW_MODAL:
      return { ...state, showModal: action.payload }
    default:
      return state
  }
}
console.log(initialState.arrayMessages)

function useChat (): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, initialState)

  return [state, dispatch]
}

export { useChat, ActionType }
