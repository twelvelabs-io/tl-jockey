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
        dispatch({ type: ActionType.SET_CHOOSED_ELEMENT, payload: videoInfo._id });
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
        question: string,
        index: number | undefined
      ): void => {
        dispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: question })
        dispatch({ type: ActionType.SET_CHOOSED_ELEMENT, payload: index })
        dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true })
      },

    //   getNewPageIndex : (
    //     modalType: ModalType,
    //     chosenIndex: number,
    //     totalIndexes: number,
    //     panelVideosList: any[],
    //     direction: 'previous' | 'next'
    //   ): number => {
    //     const findCurrentPosition = (array: any[], chosenIndex: any): number => {
    //         return array.findIndex((item) => item._id === chosenIndex);
    //       };
    //     if (modalType === ModalType.MESSAGES) {
    //       if (direction === 'previous') {
    //         return chosenIndex === 0 ? totalIndexes - 1 : chosenIndex - 1;
    //       } else {
    //         return chosenIndex === totalIndexes - 1 ? 0 : chosenIndex + 1;
    //       }
    //     } else if (modalType === ModalType.PANEL) {
    //       const currentPos = findCurrentPosition(panelVideosList, chosenIndex);
    //       if (direction === 'previous') {
    //         return currentPos === 0 ? panelVideosList.length - 1 : currentPos - 1;
    //       } else {
    //         return currentPos === panelVideosList.length - 1 ? 0 : currentPos + 1;
    //       }
    //     }
    //     // Default case if no modal type matches, returning -1 for safety
    //     return -1;
    //   },
  };
  
export default helpersFunctions;
