import { type QuestionMessage } from '../../../types/messageTypes'

export enum ActionType {
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
    selectedFile: File | null | string | any;
    selectedFileData: Object | null | any;
    responseText: string | any;
    inputBox: string;
    linkUrl: string;
    loading: boolean;
    arrayMessages: QuestionMessage[];
    showModal: boolean;
  }
  
  export type Action =
    | { type: ActionType, payload: any };
  