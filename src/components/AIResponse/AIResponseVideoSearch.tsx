import React, { Dispatch, SetStateAction, Suspense } from 'react'
import FallBackVideoSingle from '../Fallback/FallBackVideoSingle';
import VideoThumbnail from '../ChatMessagesList/VideoThumbnail';
import StreamingTextEffect from '../StreamingText/StreamingTextEffect';
import SeeMoreResultsButton from '../ChatMessagesList/SeeMoreResultsButton';
import { Message } from '../ChatMessagesList/AIResponse';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface AIResponseVideoSearch {
    message: Message
    showAllVideos: boolean;
    setShowAllVideos: Dispatch<SetStateAction<boolean>>
    videosLengthMoreThan3: boolean | undefined
    formattedDurations: string[],
    handleVideoClick: (index: number | undefined) => void
}

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearch> = ({ message, showAllVideos, setShowAllVideos, videosLengthMoreThan3, formattedDurations, handleVideoClick }) => {

    return (
        <div>
        <ul className={'flex flex-wrap pb-3 gap-2'}>
        {message.toolsData && message.toolsData.slice(0, showAllVideos ? undefined : 3).map((video, index) => {
          return (
            <li key={index} className=" ">
              <div className="flex flex-row justify-between items-start gap-2">
                { video  ?  
                <Suspense fallback={<FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} duration={formattedDurations[index]}/>}>
                  <VideoThumbnail
                    thumbnailUrl={video.thumbnail_url}
                    index={index}
                    onClick={() => handleVideoClick(index)}
                    duration={formattedDurations[index]}
                    oneThumbnail={message?.toolsData && message.toolsData.length <= 1}
                  />  
                </Suspense>
                : <FallBackVideoSingle oneThumbnail={message?.toolsData && message.toolsData.length <= 1} index={index} duration={formattedDurations[index]}/>}
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
    )
}

export default AIResponseVideoSearch