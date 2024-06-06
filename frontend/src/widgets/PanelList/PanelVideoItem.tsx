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
import helpersFunctions from "../../helpers/helpers";

interface PanelVideoItemProps {
    videoID: string,
}

export const PanelVideoItem:React.FC<PanelVideoItemProps> = ({videoID}) => {
    const queryClient = useQueryClient()
    const [state, dispatch] = useChat()
    const indexID = process.env.REACT_APP_API_INDEX_ID
    const {
        data: videoInfo,
        refetch: refetchVideos,
      } = useRetrieveVideoInfo(indexID, videoID);

      useEffect(() => {
        queryClient.invalidateQueries({
          queryKey: [keys.VIDEOS, indexID, videoID],
        });
      }, []);

      const formatTimeDuration = formatTime(Math.round(videoInfo?.metadata?.duration))

      useEffect(() => {
        if (videoInfo) {
          helpersFunctions.updateChatPanelMessages(dispatch, videoInfo)
        }
      }, [videoInfo])

      const handleThumbnailClick = () => {
        helpersFunctions.openPanelModal(dispatch, videoInfo)
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

export default PanelVideoItem


