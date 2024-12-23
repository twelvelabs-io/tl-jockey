import { StreamEvent } from '@langchain/core/dist/tracers/event_stream';
import { ActionType } from '../../widgets/VideoAssistant/hooks/useChatTypes';
import { ToolMessage } from '@langchain/core/messages';

export const parseSearchResults = (rawData: StreamEvent, dispatch: any, inputBox: string) => {
    const output = rawData.data.output;
    const parsedOutput = JSON.parse(output);
    dispatch({
        type: ActionType.SET_ARRAY_MESSAGES,
        payload: [
            {
                sender: 'ai',
                text: "",
                link: "",
                linkText: "details",
                twelveText: "",
                asrTest: '',
                lameText: '',
                question: inputBox,
                toolsData: parsedOutput
            }
        ]
    });
    dispatch({
        type: ActionType.SET_LOADING,
        payload: false
    });
};

export const parseSearchParams = (rawData: StreamEvent, dispatch: any) => {
    const input = rawData.data.input;

    try {
        dispatch({
            type: ActionType.UPDATE_LAST_USER_MESSAGE,
            payload: {
                asrTest: input.query,
            },
        });
    } catch (error) {
        console.error('Error decoding JSON:', error);
        return new ToolMessage({
            content: 'Error parsing content',
            tool_call_id: 'error',
            name: 'error',
            additional_kwargs: {},
        });
    }
};

export const handleReflectEvents = (dataEvent: string, chunkData: any, dispatch: any, inputBox: string) => {
    if (dataEvent === 'on_chat_model_stream') {
        const token = chunkData?.chunk?.content;
        dispatchStreamToken(token, dispatch, inputBox);
    } else if (dataEvent === 'on_chat_model_end') {
        dispatch({
            type: ActionType.SET_LAST_AI_MESSAGE_STREAMING,
            payload: false,
        });
    }
};

const dispatchStreamToken = (token: string, dispatch: any, inputBox: string) => {
    dispatch({
        type: ActionType.STREAM_TOKEN,
        payload: {
            token,
            question: inputBox,
        },
    });
    dispatch({
        type: ActionType.SET_LAST_AI_MESSAGE_STREAMING,
        payload: true,
    });
    dispatch({
        type: ActionType.SET_LOADING,
        payload: false,
    });
};

export const handleStreamError = (dispatch: any, ActionType: any, errorMessage: string) => {
    console.error('Error during stream processing:', errorMessage);
    //TODO: get some errors state from the backend (need improvements)
    dispatch({
        type: ActionType.SET_LOADING,
        payload: false
    });
    dispatch({
        type: ActionType.SET_ERROR_MESSAGE,
        payload: 'There was a streaming error when doing stream, please come back later.',
    });
};