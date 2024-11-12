import React, { useState } from 'react';
import { ModalType } from '../../types/messageTypes';
import { ActionType, useChat } from '../../widgets/VideoAssistant/hooks/useChat';
import { AIResponseVideoSearch } from '../AIResponse/AIResponseVideoSearch';
import AIResponseHeader from '../AIResponse/AIResponseHeader';
import SkeletonChatVideoCard from '../../skeletons/SkeletonChatVideoCard';
import ExtendMessage from './helpers/ExtendMessage';
import helpersFunctions from '../../helpers/helpers';
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
  handleShow: (index: number | undefined, indexOfElementInArray: number) => void
}

const AIResponse: React.FC<AIResponseProps> = ({ message, handleShow }) => {
  const hasTextMessage = message && message.text
  const hasValidMessage = message && message.text && message.linkText
  const [state, dispatch] = useChat()
  const [showAllVideos, setShowAllVideos] = useState(false)

  const {arrayMessages} = state

  const handleVideoClick = (index: number | undefined) => {
    const indexOfMessage = arrayMessages.findIndex(msg => msg === message)
    dispatch({
      type: ActionType.SET_MODAL_TYPE,
      payload: ModalType.MESSAGES,
    });
    handleShow(index, indexOfMessage )
  };

  const urlsFromMessageText = helpersFunctions.parseCloudFrontUrls(message.text as string)
  if (urlsFromMessageText.length === 0) {
    return null
  }
  const videosLengthMoreThan3 = urlsFromMessageText.length !== 0 && urlsFromMessageText.length > 3 
  // TODO: let's use it as a hotfix for now, but for the future it's better to handle a general json instead
  return (
    <>
        <div className={'relative w-[680px]'}>
          { hasTextMessage && 
            <AIResponseHeader message={message}/>
          }
          <div className={'aiBubble ml-[40px]  whitespace-pre-line gap-4'}>
              <div>
                {message ? (
                      <AIResponseVideoSearch 
                        urlsFromMessageText={urlsFromMessageText}
                        videosLengthMoreThan3={videosLengthMoreThan3}
                        message={message}
                        handleVideoClick={handleVideoClick}
                        showAllVideos={showAllVideos}
                        setShowAllVideos={setShowAllVideos}
                        />
                  ) : <SkeletonChatVideoCard/>}
              </div>
              <div className="mt-[12px]">
              { hasValidMessage ? (
                <ExtendMessage agent={message.linkText} message={message.text}/>
            ) : <ExtendMessage agent='error' message={message.text}/>}
            </div>
          </div>
        </div>
      
    </>
  );
};

export default AIResponse;

