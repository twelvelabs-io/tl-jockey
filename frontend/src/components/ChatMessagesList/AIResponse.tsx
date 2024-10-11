import React, { useState, useMemo } from "react";
import { ReactComponent as AIIcon } from "../../icons/ai.svg";
import { formatTime } from "./formatTime";
import { ModalType } from "../../types/messageTypes";
import {
  ActionType,
  useChat,
} from "../../widgets/VideoAssistant/hooks/useChat";
import { AIResponseVideoSearch } from "../AIResponse/AIResponseVideoSearch";
import AIResponseHeader from "../AIResponse/AIResponseHeader";
import SkeletonChatVideoCard from "../../skeletons/SkeletonChatVideoCard";
import ExtendMessage from "./helpers/ExtendMessage";
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export interface Message {
  link?: string;
  linkText?: string;
  sender?: string;
  text?: string;
  toolsData?: {
    end: number;
    start: number;
    thumbnail_url: string | undefined;
    video_url: string;
    metadata: {
      type: string;
      text: string;
    }[];
    video_title: string;
  }[];
}

interface AIResponseProps {
  message: Message;
  handleShow: (
    index: number | undefined,
    indexOfElementInArray: number
  ) => void;
}

const AIResponse: React.FC<AIResponseProps> = ({ message, handleShow }) => {
  const hasTextMessage = message && message.text;
  const hasValidMessage = message && message.text && message.linkText;
  const [state, dispatch] = useChat();
  const [showAllVideos, setShowAllVideos] = useState(false);

  const { arrayMessages } = state;

  const handleVideoClick = (index: number | undefined) => {
    const indexOfMessage = arrayMessages.findIndex((msg) => msg === message);
    dispatch({
      type: ActionType.SET_MODAL_TYPE,
      payload: ModalType.MESSAGES,
    });
    handleShow(index, indexOfMessage);
  };

  const formattedDurations =
    message?.toolsData?.map((video) =>
      formatTime(Math.round(video.start), Math.round(video.end))
    ) || [];

  const videosLengthMoreThan3 =
    message?.toolsData && message.toolsData.length > 3;


  // Determine the index of the last REFLECT node
  const lastReflectIndex = useMemo(() => {
    return arrayMessages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.storedAgentName === "REFLECT" && state.runStatus === "success")
      .map(({ idx }) => idx)
      .pop();
  }, [arrayMessages]);

  // Determine if the current message is the last REFLECT node
  const isLastReflect = useMemo(() => {
    const currentIndex = arrayMessages.findIndex((msg) => msg === message);
    return currentIndex === lastReflectIndex;
  }, [arrayMessages, message, lastReflectIndex]);

  return (
    <>
      <div className={"relative w-[680px]"}>
        {hasTextMessage &&
          <AIResponseHeader message={message} />
        }
        {/* <p>Debugging UI: hasTextMessage: {hasTextMessage ? 'true' : 'false'}, hasValidMessage: {hasValidMessage ? 'true' : 'false'}, videosLengthMoreThan3: {videosLengthMoreThan3 ? 'true' : 'false'}</p> */}
        {/* show everything in message */}
        {/* <p>{JSON.stringify(message)}</p> */}
        {/* <div className={"aiBubble ml-[40px] whitespace-pre-line gap-4"}> */}
        <div className={" ml-[40px] whitespace-pre-line gap-4"}>
          <div>
            {/* log message if it exists */}
            {/* <p>{message ? "message exists" : "message does not exist"}</p>
            <p>{"message:" + JSON.stringify(message)}</p>
            <p>{"videosLengthMoreThan3:" + videosLengthMoreThan3}</p>
            <p>{"formattedDurations:" + formattedDurations}</p> */}

          </div>
          {hasValidMessage ? (
            <ExtendMessage agent={message.linkText} message={message.text} />
          ) : (
            <ExtendMessage agent="error" message={message.text} />
          )}
          {/* show isLastReflect */}
          {/* <p>{"isLastReflect: " + isLastReflect}</p>
         <p>{"runStatus: " + state.runStatus}</p>  */}
          {message ? (
            <div className="flex flex-row flex-wrap mt-4"> {/* Ensure flex-row and flex-wrap are applied here */}
              <AIResponseVideoSearch
                videosLengthMoreThan3={videosLengthMoreThan3}
                message={message}
                formattedDurations={formattedDurations}
                handleVideoClick={handleVideoClick}
                showAllVideos={showAllVideos}
                setShowAllVideos={setShowAllVideos}
                isLastReflect={isLastReflect}
              />
            </div>
          ) : (
            // ) : <SkeletonChatVideoCard/>}
            ""
          )}
        </div>
      </div>
    </>
  );
};

export default AIResponse;
