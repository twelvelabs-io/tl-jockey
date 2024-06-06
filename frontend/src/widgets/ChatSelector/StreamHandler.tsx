import React, { Dispatch } from 'react';
import { ActionType } from '../VideoAssistant/hooks/useChat';
import { Action } from '../VideoAssistant/hooks/useChatTypes';

interface StreamHandlerProps {
    response: Response;
    ActionType: any;
    dispatch: Dispatch<Action>;
    inputBox: string;
    setStreamData: Function;
    arrayMessages: any;
  }
  

const StreamHandler = async ({ response, ActionType, dispatch, inputBox, setStreamData, arrayMessages }: StreamHandlerProps) => {
    console.log('here')
    if (!response.ok) {
        throw new Error(response.statusText);
      }
      console.log(response)
      dispatch({
        type: ActionType.SET_ARRAY_MESSAGES,
        payload: [
          {
            sender: 'ai',
            text: '',
            link: '',
            linkText: '',
            twelveText: '',
            asrTest: '',
            lameText: '',
            question: ''
          }
        ]
      })
      let jsonData = ''; 
      const responseBody = response.body;
      if (!responseBody) {
        throw new Error('Response body is null or undefined');
      }
      dispatch({ type: ActionType.SET_LOADING, payload: true })
      const reader = responseBody.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';
    
      
      async function processChunk(chunkValue: string) {
        if (!chunkValue.startsWith('Running =>')) {
          accumulatedContent += chunkValue
        }
        console.log(accumulatedContent)
        const jsonStartIndex =accumulatedContent.indexOf('[');
        const jsonEndIndex = accumulatedContent.lastIndexOf(']');
        let accumulatedContentWithoutJSON = accumulatedContent.replace(/\[.*\]/s, '')
        if (chunkValue.startsWith('Running =>')) {
          dispatch({
            type: ActionType.SET_STATUS_MESSAGES,
            payload: [chunkValue],
          });
        }
        dispatch({
          type: ActionType.CHANGE_ARRAY_MESSAGE,
          payload: [
            {
              sender: 'ai',
              text: accumulatedContentWithoutJSON,
              link: '',
              linkText: '',
              twelveText: accumulatedContentWithoutJSON,
              asrTest: '',
              lameText: '',
              question: inputBox
            }
          ]
        });
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonStartIndex < jsonEndIndex) {
          const jsonChunk = accumulatedContent.substring(jsonStartIndex, jsonEndIndex + 1);
          try {
            setStreamData((prevData: any) => [...prevData, chunkValue]);
            jsonData = JSON.parse(jsonChunk);
            console.log(arrayMessages)
            console.log('Parsed JSON data:', jsonData);
            dispatch({
              type: ActionType.ADD_TOOLS_DATA_TO_LAST_ELEMENT,
              payload: jsonData
            });
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        } 
        console.log("Received chunk:", chunkValue);
        console.log("Accumulated content:", accumulatedContent);
      }
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (done) {
          break;
        }
        done = doneReading;
          const chunkValue = decoder.decode(value, { stream: true });
          await processChunk(chunkValue)
    
          console.log("Received chunk:", chunkValue);
          console.log("Accumulated content:", accumulatedContent);
      }
      dispatch({ type: ActionType.SET_LOADING, payload: false })
      console.log("Streaming complete. Final content:", accumulatedContent);
      dispatch({
        type: ActionType.CLEAR_STATUS_MESSAGES,
        payload: [],
      });
      dispatch({ type: ActionType.SET_LOADING, payload: false })
      return accumulatedContent
}

export default StreamHandler;