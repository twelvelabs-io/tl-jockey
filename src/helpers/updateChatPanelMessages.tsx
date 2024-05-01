import { Dispatch } from 'react';
import { ActionType } from '../widgets/VideoAssistant/hooks/useChatTypes';

export const updateChatPanelMessages = (
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
};
