import { useReducer } from 'react'
import { ActionType, State, Action } from './useChatTypes'

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

function useChat (): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, initialState)

  return [state, dispatch]
}

export { useChat, ActionType }
