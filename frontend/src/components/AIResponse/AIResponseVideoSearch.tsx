import React, { Dispatch, SetStateAction, Suspense, useRef } from 'react'
import FallBackVideoSingle from '../Fallback/FallBackVideoSingle';
import VideoThumbnail from '../ChatMessagesList/VideoThumbnail';
import StreamingTextEffect from '../StreamingText/StreamingTextEffect';
import SeeMoreResultsButton from '../ChatMessagesList/SeeMoreResultsButton';
import { Message } from '../ChatMessagesList/AIResponse';
import ReactHlsPlayer from 'react-hls-player';
import helpersFunctions from '../../helpers/helpers';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface AIResponseVideoSearch {
    message: Message
    handleVideoClick: (index: number | undefined) => void
}

const getFirstParagraph = (text: string): string => {
  if (!text) return '';
  const paragraphs = text.split('\n\n');
  return paragraphs[0];
};

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearch> = ({ message, handleVideoClick }) => {
  const urlsFromMessageText = helpersFunctions.parseCloudFrontUrls(message.text as string)
  console.log(message.text)
    return (
      <div className="flex flex-col gap-[12px]">
      {message?.text && urlsFromMessageText.length > 0 && (
        <p className="text-[#333431] font-aeonik text-base">
          {<StreamingTextEffect text={getFirstParagraph(message.text)} />}
        </p>
      )}
      <div className="flex flex-row justify-between items-start gap-[12px]">
        { message  ?  
        // <Suspense fallback={<FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} duration={formattedDurations[index]}/>}>
        <Suspense>
            {message?.text && (
              <div className="video-urls-container flex flex-col gap-4">
                {urlsFromMessageText.map((video, index) => (
                  <ReactHlsPlayer
                    key={index}
                    src={video.url}
                    width={'854px'}
                    controls={true}
                    height="520px"
                    playerRef={useRef(null)}
                    className={'rounded'}
                  />
                ))}
              </div>
            )}
        </Suspense> : ''}
        {/* // : <FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} />} */}
        <div className="flex-grow w-[400px]">
          {/* Apply the streaming effect to the text */}
          {/* { message.text && <StreamingTextEffect text={message.text} />} */}
        </div>
      </div>
      </div>
    )
}

export default AIResponseVideoSearch