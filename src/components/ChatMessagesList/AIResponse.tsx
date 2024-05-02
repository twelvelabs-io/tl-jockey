import React, { useState } from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
import { formatTime } from './formatTime';
import { ModalType } from '../../types/messageTypes';
import { ActionType, useChat } from '../../widgets/VideoAssistant/hooks/useChat';
import { AIResponseVideoSearch } from '../AIResponse/AIResponseVideoSearch';
import AIResponseHeader from '../AIResponse/AIResponseHeader';
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
  handleShow: (index: number | undefined, question: string) => void
}

const AIResponse: React.FC<AIResponseProps> = ({ message, handleShow }) => {
  const hasValidMessage = message && message.text
  const [state, dispatch] = useChat()
  const [showAllVideos, setShowAllVideos] = useState(false)

  const handleVideoClick = (index: number | undefined) => {
    dispatch({
      type: ActionType.SET_MODAL_TYPE,
      payload: ModalType.MESSAGES,
    });
    handleShow(index, "")
  };

  const formattedDurations =
    message?.toolsData?.map((video) =>
      formatTime(Math.round(video.start), Math.round(video.end))
    ) || [];
  
  const videosLengthMoreThan3 = message?.toolsData && message.toolsData.length > 3

  return (
    <>
        <div className={'relative ml-7'}>
          {hasValidMessage && 
            <AIResponseHeader message={message}/>
          }
          <div className={'mr-[5px] aiBubble ml-7 whitespace-pre-line gap-4'}>
              <div>
                {message?.toolsData && (
                    <AIResponseVideoSearch 
                      videosLengthMoreThan3={videosLengthMoreThan3}
                      message={message}
                      formattedDurations={formattedDurations}
                      handleVideoClick={handleVideoClick}
                      showAllVideos={showAllVideos}
                      setShowAllVideos={setShowAllVideos}
                      />
                )}
              </div>
              {message && (
              <div>
                {/* {!hasValidMessage && message.text} */}
                {!message?.toolsData && message.text}
              </div>
            )}
          </div>
        </div>
      
    </>
  );
};

export default AIResponse;

