import React, { Dispatch, SetStateAction, Suspense, useRef } from 'react'
import FallBackVideoSingle from '../Fallback/FallBackVideoSingle';
import VideoThumbnail from '../ChatMessagesList/VideoThumbnail';
import StreamingTextEffect from '../StreamingText/StreamingTextEffect';
import SeeMoreResultsButton from '../ChatMessagesList/SeeMoreResultsButton';
import { Message } from '../ChatMessagesList/AIResponse';
import ReactHlsPlayer from 'react-hls-player';
import helpersFunctions from '../../helpers/helpers';
import { VideoInfo } from '../../types/messageTypes';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface AIResponseVideoSearch {
    urlsFromMessageText: VideoInfo[]
    showAllVideos: boolean;
    setShowAllVideos: Dispatch<SetStateAction<boolean>>
    videosLengthMoreThan3: boolean | undefined
    message: Message
    handleVideoClick: (index: number | undefined) => void
}

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearch> = ({urlsFromMessageText, showAllVideos, setShowAllVideos,  message, handleVideoClick, videosLengthMoreThan3 }) => {
  const firstParagraphFromMessageText = helpersFunctions.getFirstParagraph(message.text as string)
  if (urlsFromMessageText.length === 0) {
    return null
  }
  const playerRefs = urlsFromMessageText.map(() => useRef(null))
  console.log(message.text)
    return (
      <div className="flex flex-col gap-[12px]">
      {message?.text && urlsFromMessageText.length > 0 && (
        <p className="text-[#333431] font-aeonik text-base">
          { <StreamingTextEffect text={firstParagraphFromMessageText} />}
        </p>
      )}
      <div className="flex flex-row justify-between items-start gap-[12px]">
        { message  ?  
        // <Suspense fallback={<FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} duration={formattedDurations[index]}/>}>
        <Suspense>
            {message?.text && (
              <div className="video-urls-container flex flex-col gap-4">
                {urlsFromMessageText.slice(0, showAllVideos ? undefined : 3).map((video, index) => (
                  <ReactHlsPlayer
                    key={index}
                    src={video.url}
                    width={'854px'}
                    controls={true}
                    height="520px"
                    playerRef={playerRefs[index]}
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
      {videosLengthMoreThan3 && (
        <SeeMoreResultsButton
          showAllVideos={showAllVideos}
          setShowAllVideos={setShowAllVideos}
          message={message}
          videosUrls={urlsFromMessageText}
        />
      )}
      </div>
    )
}

export default AIResponseVideoSearch