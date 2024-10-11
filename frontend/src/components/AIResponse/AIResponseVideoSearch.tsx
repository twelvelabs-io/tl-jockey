import React, {
  Dispatch,
  SetStateAction,
  Suspense,
  useState,
  useEffect,
} from "react";
import FallBackVideoSingle from "../Fallback/FallBackVideoSingle";
import VideoThumbnail from "../ChatMessagesList/VideoThumbnail";
import StreamingTextEffect from "../StreamingText/StreamingTextEffect";
import SeeMoreResultsButton from "../ChatMessagesList/SeeMoreResultsButton";
import { Message } from "../ChatMessagesList/AIResponse";
import {
  useChat,
  ActionType,
} from "../../widgets/VideoAssistant/hooks/useChat";
import { State } from "../../widgets/VideoAssistant/hooks/useChatTypes";

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface AIResponseVideoSearch {
  message: Message;
  showAllVideos: boolean;
  setShowAllVideos: Dispatch<SetStateAction<boolean>>;
  videosLengthMoreThan3: boolean | undefined;
  formattedDurations: string[];
  handleVideoClick: (index: number | undefined) => void;
}

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearch> = ({
  message,
  showAllVideos,
  setShowAllVideos,
  videosLengthMoreThan3,
  formattedDurations,
  handleVideoClick,
}) => {
  const [state, dispatch] = useChat();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    undefined
  );
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [isFinished, setIsFinished] = useState<boolean>(false); // New state for isFinished

  const parseThumbnailFromMessage = (message: Message) => {
    const rawReflectNodeOutput = message?.text;
    const thumbnailUrlRegex = /!\[Thumbnail\]\((https?:\/\/[^\s]+)\)/;
    const thumbnailUrlMatch = rawReflectNodeOutput?.match(thumbnailUrlRegex);
    if (thumbnailUrlMatch) {
      setThumbnailUrl(thumbnailUrlMatch[1]);
    }
  };

  const parseVideoUrlFromMessage = (message: Message) => {
    const rawReflectNodeOutput = message?.text;
    const videoUrlRegex = /\[Watch the clip\]\((https?:\/\/[^\s]+)\)/;
    const videoUrlMatch = rawReflectNodeOutput?.match(videoUrlRegex);

    if (videoUrlMatch) {
      setVideoUrl(videoUrlMatch[1]);
    }
  };

  const VideoContent: React.FC = () => {
    return (
      <div className="rounded-lg overflow-hidden">
        <video
          src="https://bctglljrspqfnyst.public.blob.vercel-storage.com/clip1-acSeiV1USauyPPw8dziufSGBifE5ZK.mp4"
          autoPlay
          loop
          controls
          className="w-full h-full"
        />
      </div>
    );
  };

  useEffect(() => {
    const runStatus = state.runStatus;

    if (state.arrayMessages.at(-1)?.storedAgentName === "REFLECT" && runStatus === "success") {
      setIsFinished(true); // Update isFinished state
    } else {
      setIsFinished(false); // Update isFinished state
    }
  }, [state]);

  return (
    <div className="">
      <ul className={"flex flex-wrap pb-3 gap-[12px]"}>
        {/* log isFinished */}
        <p>{"isFinished: " + isFinished}</p>
        {message.toolsData &&
          message.toolsData
            .slice(0, showAllVideos ? undefined : 3)
            .map((video, index) => {
              console.log("Video data!!!!!!!:", video);
              return (
                <li key={index} className=" ">
                  <div className="flex flex-row justify-between items-start gap-[12px]">
                    {isFinished ? (
                      <Suspense
                        fallback={
                          <FallBackVideoSingle
                            oneThumbnail={
                              message?.toolsData &&
                              message.toolsData.length <= 1
                            }
                            index={index}
                            duration={formattedDurations[index]}
                          />
                        }
                      >
                        <VideoContent />
                        <VideoThumbnail
                          thumbnailUrl={video.thumbnail_url || thumbnailUrl}
                          index={index}
                          onClick={() => handleVideoClick(index)}
                          duration={formattedDurations[index]}
                          oneThumbnail={
                            message?.toolsData && message.toolsData.length <= 1
                          }
                        />
                      </Suspense>
                    ) : (
                      <FallBackVideoSingle
                        oneThumbnail={
                          message?.toolsData && message.toolsData.length <= 1
                        }
                        index={index}
                        duration={formattedDurations[index]}
                      />
                    )}
                    <div className="flex-grow w-[400px]">
                      {/* Apply the streaming effect to the text */}
                      {video && (
                        <StreamingTextEffect text={video.video_title} />
                      )}
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
  );
};

export default AIResponseVideoSearch;
