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
interface AIResponseVideoSearchProps {
  message: Message;
  showAllVideos: boolean;
  setShowAllVideos: Dispatch<SetStateAction<boolean>>;
  videosLengthMoreThan3: boolean | undefined;
  formattedDurations: string[];
  handleVideoClick: (index: number | undefined) => void;
  isLastReflect: boolean; // New prop to indicate if it's the last REFLECT
}

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearchProps> = ({
  message,
  showAllVideos,
  setShowAllVideos,
  videosLengthMoreThan3,
  formattedDurations,
  handleVideoClick,
  isLastReflect, // Destructure the new prop
}) => {
  const [state, dispatch] = useChat();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    undefined
  );
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);

  // Removed isFinished state

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

  const VideoContent: React.FC<{ src: string }> = ({ src }) => {
    return (
      <div className="rounded-lg overflow-hidden">
        <video src={src} autoPlay loop muted className="w-full h-full" />
      </div>
    );
  };

  useEffect(() => {
    parseThumbnailFromMessage(message);
    parseVideoUrlFromMessage(message);
  }, [message]);

  // for demo purposes
  const tempArray3 = [
    "https://bctglljrspqfnyst.public.blob.vercel-storage.com/clip1-acSeiV1USauyPPw8dziufSGBifE5ZK.mp4",
    "https://bctglljrspqfnyst.public.blob.vercel-storage.com/clip2-tP1ouw1XdIRtjim3YMb17rexTHMS8L.mp4",
    "https://bctglljrspqfnyst.public.blob.vercel-storage.com/clip3-c6ennHRQ29HkSn0oYMm7BFf87ApjkU.mp4",
  ];

  const tempArray1 = [
    "https://bctglljrspqfnyst.public.blob.vercel-storage.com/clip1-acSeiV1USauyPPw8dziufSGBifE5ZK.mp4",
  ];
  const tempArray =
    state.arrayMessages.at(-1)?.question === "Find the top 3 clips of a touchdown"
      ? tempArray3
      : tempArray1;


  const isMultipleVideos = tempArray.length > 1;

  return (
    <div className="w-full">
      <ul className={`flex ${isMultipleVideos ? 'flex-row flex-wrap' : 'flex-col'} gap-2`}>
        {/* <p>{"isLastReflect: " + isLastReflect}</p>
        <p>{"showAllVideos: " + showAllVideos}</p>
        <p>{"formattedDurations: " + formattedDurations}</p> */}
        {tempArray.map((videoUrl, index) => (
          <li key={index} className={`${isMultipleVideos ? 'w-[calc(50.33%-1rem)]' : 'w-full'}`}>
            <div className="flex flex-col gap-2">
              {isLastReflect && (
                <div className="w-full aspect-video">
                  <Suspense
                    fallback={
                      <FallBackVideoSingle
                        oneThumbnail={formattedDurations.length <= 1}
                        index={index}
                        duration={formattedDurations[index]}
                      />
                    }
                  >
                    <VideoContent src={videoUrl} />
                  </Suspense>
                </div>
              )}
              <div className="w-full">
                {/* Video title or other content */}
                {/* <p className="text-sm">Video {index + 1}</p> */}
              </div>
            </div>
          </li>
        ))}
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