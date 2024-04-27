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
            dispatch({
                type: ActionType.SET_PANEL_ARRAY_MESSAGES,
                payload: [
                    {
                        hls: {
                            video_url: videoInfo.hls.video_url,
                            thumbnails_urls: videoInfo.hls.thumbnail_urls
                        },
                        metadata: {
                            duration: videoInfo.metadata.duration,
                            filename: videoInfo.metadata.filename,
                        },
                        _id: videoInfo._id, // Unique identifier
                    },
                ],
            });
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


