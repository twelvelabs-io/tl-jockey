/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import React, { useEffect } from "react";
import { useQueryClient } from "react-query";
import { useRetrieveVideoInfo } from "../../apis/hooks";
import keys from "../../apis/keys";
import Thumbnail from "../../components/Thumbnail/Thumbnail";
import { formatTime } from "../../components/ChatMessagesList/formatTime";
import { ActionType, useChat } from "../VideoAssistant/hooks/useChat";
import { ModalType } from "../../types/messageTypes";
import FallBackVideoPlaceholder from "../../components/Fallback/FallBackVideoPlaceholder";
import { updateChatPanelMessages } from "../../helpers/updateChatPanelMessages";

interface PanelVideoItemProps {
    videoID: string,
}

export const PanelVideoItem:React.FC<PanelVideoItemProps> = ({videoID}) => {
    const queryClient = useQueryClient()
    const [state, dispatch] = useChat()
    const {
        data: videoInfo,
        refetch: refetchVideos,
      } = useRetrieveVideoInfo('659f2e829aba4f0b402f6488', videoID);

      useEffect(() => {
        queryClient.invalidateQueries({
          queryKey: [keys.VIDEOS, '659f2e829aba4f0b402f6488', videoID],
        });
      }, []);

      const formatTimeDuration = formatTime(Math.round(videoInfo?.metadata?.duration))

      useEffect(() => {
        if (videoInfo) {
            updateChatPanelMessages(dispatch, videoInfo)
        }
      }, [videoInfo])

      const handleThumbnailClick = () => {
        dispatch({
            type: ActionType.SET_MODAL_TYPE,
            payload: ModalType.PANEL,
        });
        dispatch({ type: ActionType.SET_CHOOSED_ELEMENT, payload: videoInfo._id });
        dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
      }; 


    return (
        <>
          {videoInfo ? (
            <Thumbnail
              thumbnailUrl={videoInfo.hls.thumbnail_urls[0]}
              onClick={handleThumbnailClick}
              duration={formatTimeDuration}
              oneThumbnail={false}
              text={videoInfo.metadata.filename}
            />
          ) : (
            <FallBackVideoPlaceholder/>
          )}
        </>
      );
}
//thumbnailUrl, index, onClick, duration, oneThumbnail
export default PanelVideoItem


