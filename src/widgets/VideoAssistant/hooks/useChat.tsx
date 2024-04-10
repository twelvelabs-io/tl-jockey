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
  statusMessages: [],
  showModal: false,
  toolsData: []
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
    case ActionType.CLEAR_STATUS_MESSAGES:
        return { ...state, statusMessages: [] }
    case ActionType.SET_STATUS_MESSAGES:
      return { ...state, statusMessages: [...state.statusMessages, ...action.payload] }
    case ActionType.CHANGE_ARRAY_MESSAGE:
      const newArrayMessages = [...state.arrayMessages];
      const newMessage = action.payload[0]; // Assuming payload is an array, extract the first element
      newArrayMessages[newArrayMessages.length - 1] = newMessage; // Change only the last element
      return { ...state, arrayMessages: newArrayMessages }
    case ActionType.SET_ARRAY_MESSAGES_CLEAN:
      return { ...state, arrayMessages: [] }
    case ActionType.SET_SHOW_MODAL:
      return { ...state, showModal: action.payload }
      case ActionType.ADD_TOOLS_DATA_TO_LAST_ELEMENT:
      const lastElementIndex = state.arrayMessages.length - 1;
      if (lastElementIndex >= 0) {
        const updatedLastElement = {
          ...state.arrayMessages[lastElementIndex],
          toolsData: action.payload
        };
        const newArrayMessages = [...state.arrayMessages];
        newArrayMessages[lastElementIndex] = updatedLastElement;
        return { ...state, arrayMessages: newArrayMessages };
      } else {
        return state; // No messages to add tools data to
      }
    default:
      return state
  }
}

function useChat (): [State, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, initialState)

  return [state, dispatch]
}

export { useChat, ActionType }
