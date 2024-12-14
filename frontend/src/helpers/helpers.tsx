import { Dispatch } from 'react';
import { ActionType } from '../widgets/VideoAssistant/hooks/useChatTypes';
import { ModalType, VideoInfo } from '../types/messageTypes';

const helpersFunctions = {
    updateChatPanelMessages: (
      dispatch: Dispatch<any>,
      videoInfo: any
    ): void => {
      dispatch({
        type: ActionType.SET_PANEL_ARRAY_MESSAGES,
        payload: [
          {
            hls: {
              video_url: videoInfo.hls.video_url,
              thumbnails_urls: videoInfo.hls.thumbnail_urls,
            },
            metadata: {
              duration: videoInfo.metadata.duration,
              filename: videoInfo.metadata.filename,
            },
            _id: videoInfo._id,
          },
        ],
      });
    },

    parseCloudFrontUrls : (text: string): VideoInfo[] => {
      const urls: VideoInfo[] = [];
      const urlRegex = /https:\/\/[^\s)]+cloudfront[^\s)]*?\.m3u8\b/g;

      let match;
      while ((match = urlRegex.exec(text)) !== null) {
        urls.push({ url: match[0] });
      }
      return urls;
    },
  
    openPanelModal: (
        dispatch: Dispatch<any>,
        videoInfo: any
      ): void => {
        dispatch({
            type: ActionType.SET_MODAL_TYPE,
            payload: ModalType.PANEL,
        });
        dispatch({ type: ActionType.SET_CHOOSED_ELEMENT, payload: [ 0, videoInfo._id ] });
        dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
      },

    closeAndClearModal: (
        dispatch: Dispatch<any>,
        handleClose: () => void
      ): void => {
        dispatch({ type: ActionType.SET_LOADING, payload: false })
        dispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
        dispatch({
            type: ActionType.SET_ARRAY_MESSAGES_CLEAN,
            payload: []
        })
        handleClose()
      },

     getVideoWordDynamic : (length: any): string => {
        return length === 1 ? 'video' : 'videos';
    },

    openClearModal: (
        dispatch: Dispatch<any>,
      ): void => {
        dispatch({
            type: ActionType.SET_MODAL_TYPE,
            payload: ModalType.CLEAR_CHAT,
        });
        dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
      },

    openMessagesModal : (
        dispatch: Dispatch<any>,
        indexOfElementInArray: number,
        index: number | undefined
      ): void => {
        dispatch({ type: ActionType.SET_CHOOSED_ELEMENT, payload: [ indexOfElementInArray, index ] })
        dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true })
      },

    processChunk: async (chunkValue: string, accumulatedContent: string, dispatch: Dispatch<any>, inputBox: string, setStreamData:any, jsonData:any, arrayMessages:any) =>  {
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
  };
  
export default helpersFunctions;
