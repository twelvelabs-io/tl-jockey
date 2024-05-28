import { Dispatch } from 'react';
import { ActionType } from '../widgets/VideoAssistant/hooks/useChatTypes';
import { ModalType } from '../types/messageTypes';

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
  };
  
export default helpersFunctions;
