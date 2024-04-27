import React, { useState } from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
import { formatTime } from './formatTime';
import SeeMoreResultsButton from './SeeMoreResultsButton';
import VideoThumbnail from './VideoThumbnail';
import { ModalType } from '../../types/messageTypes';
import { ActionType, useChat } from '../../widgets/VideoAssistant/hooks/useChat';
import { StreamingTextEffect } from '../StreamingText/StreamingTextEffect';
import FallBackVideoPlaceholder from '../Fallback/FallBackVideoPlaceholder';
import FallBackVideoSingle from '../Fallback/FallBackVideoSingle';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export interface Message {
  link?: string;
  linkText?: string;
  sender?: string
  text?: string;
  toolsData?: {
    end: number;
    start: number;
    thumbnail_url: string | undefined; video_url: string ;
    metadata: {
      type: string;
      text: string;
    }[];
    video_title: string
} []
}

interface AIResponseProps {
  message: Message;
  handleClick: (event: React.MouseEvent<HTMLSpanElement>) => void;
  handleShow: (index: number | undefined, question: string) => void
}

const AIResponse: React.FC<AIResponseProps> = ({ message, handleClick, handleShow }) => {
  const hasValidMessage = message && message.toolsData;
  const [state, dispatch] = useChat()
  const hasValidLink = message && message.link != null && message.linkText != null;
  const [showAllVideos, setShowAllVideos] = useState(false)

  const handleVideoClick = (index: number | undefined) => {
    dispatch({
      type: ActionType.SET_MODAL_TYPE,
      payload: ModalType.MESSAGES,
    });
    handleShow(index, "Another quick hitter Devante Adams again")
  };

  const formattedDurations =
    message?.toolsData?.map((video) =>
      formatTime(Math.round(video.start), Math.round(video.end))
    ) || [];
  
  const videosLengthMoreThan3 = message?.toolsData && message.toolsData.length > 3

  return (
    <>
      {hasValidMessage && (
        <div className={'relative ml-7'}>
          <div className={'flex flex-row gap-2 items-center'}>
            <div className={'w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
              <AIIcon />
            </div>
            <div className={'font-aeonikBold'}>
                  { message?.sender === 'ai' && 'Jockey'  }
            </div>
          </div>
          <div className={'mr-[5px] aiBubble ml-7 whitespace-pre-line gap-4'}>
              <div>
                {message?.toolsData && (
                  <div>
                        <ul className={'flex flex-wrap pb-3 gap-2'}>
                        {message.toolsData.slice(0, showAllVideos ? undefined : 3).map((video, index) => {

                          const conversationTexts =  video.metadata
                            ?.filter((item) => item.type === 'conversation')
                            .map((filteredItem) => filteredItem.text); // Get all conversation texts

                          return (
                            <li key={index} className=" ">
                              <div className="flex flex-row justify-between items-start gap-2">
                                {video.thumbnail_url ?  <VideoThumbnail
                                  thumbnailUrl={video.thumbnail_url}
                                  index={index}
                                  onClick={() => handleVideoClick(index)}
                                  duration={formattedDurations[index]}
                                  oneThumbnail={message?.toolsData && message.toolsData.length <= 1}
                                />  : <FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} duration={formattedDurations[index]}/>}
                                <div className="flex-grow-0 w-[466px]">
                                  {/* Apply the streaming effect to the text */}
                                  { video && <StreamingTextEffect text={video.video_title} />}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    {videosLengthMoreThan3 && (
                      <SeeMoreResultsButton
                        showAllVideos={showAllVideos}
                        setShowAllVideos={setShowAllVideos}
                        message={message}
                      />
                    )}
                  </div>
                )}
              </div>
              {hasValidLink && (
              <div>
                {!hasValidMessage && message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIResponse;

