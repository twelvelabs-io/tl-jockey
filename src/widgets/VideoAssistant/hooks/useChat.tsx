import React, { ReactNode, createContext, useContext, useReducer } from 'react';

import { ActionType, State, Action } from './useChatTypes'
import { ModalType } from '../../../types/messageTypes';

const initialState: State = {
  selectedFile: null,
  selectedFileData: null,
  responseText: '',
  inputBox: '',
  linkUrl: '',
  loading: false,
  arrayMessages: [{
    twelveText: 'Hey',
    asrTest: '',
    lameText: '',
    question: 'Hey',
    toolsData: [],
    sender: 'initial',
    text: 'Howdy! The Twelve Labs platform, powered by our video foundation model, allows you to search, generate-text and classify from your videos. Experience the Twelve Labs video understanding AI in action.',
    handleShow(index, question) {
    },
  }],
  statusMessages: [],
  showModal: false,
  modalType: ModalType.MESSAGES,
  toolsData: [],
  autofill: {
    choosedElement: [ 0, 0 ],
    autofillApi: false,
    showAutofillQuestions: false,
  },
  panelVideosList: []
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
    case ActionType.SET_PANEL_ARRAY_MESSAGES:
      return { ...state, panelVideosList: [...state.panelVideosList, ...action.payload] }
    case ActionType.CLEAR_STATUS_MESSAGES:
        return { ...state, statusMessages: [] }
    case ActionType.SET_STATUS_MESSAGES:
      return { ...state, statusMessages: [...state.statusMessages, ...action.payload] }
    case ActionType.CHANGE_ARRAY_MESSAGE:
      const newArrayMessages = [...state.arrayMessages];
      const newMessage = action.payload[0]; // Assuming payload is an array, extract the first element
      newArrayMessages[newArrayMessages.length - 1] = newMessage; // Change only the last element
      return { ...state, arrayMessages: newArrayMessages }
    case ActionType.REMOVE_INITIAL_MESSAGE:
        if (state.arrayMessages.length > 0 && state.arrayMessages[0].sender === "initial") {
          const newArrayMessages = [...state.arrayMessages];
          newArrayMessages.shift(); // Remove the first element
          return { ...state, arrayMessages: newArrayMessages };
        } else {
          return state; // No initial message to remove
        }
    case ActionType.SET_ARRAY_MESSAGES_CLEAN:
      return { ...state, arrayMessages: [] }
    case ActionType.CLEAR_ALL_BUT_FIRST_ARRAY_MESSAGE:
      const initialMessage = initialState.arrayMessages[0]; 
      return { ...state, arrayMessages: [initialMessage] };
    case ActionType.SET_SHOW_MODAL:
      return { ...state, showModal: action.payload }
    case ActionType.SET_MODAL_TYPE:
        return { ...state, modalType: action.payload };
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
      case ActionType.SET_CHOOSED_ELEMENT:
        return { ...state, autofill: { ...state.autofill, choosedElement: action.payload } };
      case ActionType.SET_AUTOFILL_API:
        return { ...state, autofill: { ...state.autofill, autofillApi: action.payload } };
      case ActionType.SET_SHOW_AUTOFILL_QUESTIONS:
        return { ...state, autofill: { ...state.autofill, showAutofillQuestions: action.payload } }
    default:
      return state
  }
}

const ChatContext = createContext<[State, React.Dispatch<Action>] | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ChatContext.Provider value={[state, dispatch]}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): [State, React.Dispatch<Action>] => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export { ActionType }
