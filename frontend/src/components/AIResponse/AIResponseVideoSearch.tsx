import React, { Dispatch, SetStateAction, Suspense, useState, useEffect } from 'react'
import SeeMoreResultsButton from '../ChatMessagesList/SeeMoreResultsButton';
import { QuestionMessage } from '../../types/messageTypes';
import { AnimatedMessage } from '../AnimatedMessage/AnimatedMessage';
import ThumbnailsList from '../Thumbnail/ThumbnailsList';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface AIResponseVideoSearch {
    urlsFromMessageText: QuestionMessage['toolsData']
    showAllVideos: boolean;
    setShowAllVideos: Dispatch<SetStateAction<boolean>>
    videosLengthMoreThan3: boolean | undefined
    message: QuestionMessage
    handleVideoClick: (index: number | undefined) => void
}

export const AIResponseVideoSearch: React.FC<AIResponseVideoSearch> = ({urlsFromMessageText, showAllVideos, setShowAllVideos,  message, handleVideoClick, videosLengthMoreThan3 }) => {
  const [showControls, setShowControls] = useState<boolean[]>(new Array(message?.toolsData?.length).fill(false));
  const [loadedThumbnails, setLoadedThumbnails] = useState<boolean[]>(new Array(message?.toolsData?.length).fill(false));
  
  const [playerRefs, setPlayerRefs] = useState<Array<any>>([]);

  useEffect(() => {
    if (message?.toolsData?.length) {
      const newRefs = message.toolsData.map(() => React.createRef());
      setPlayerRefs(newRefs);
    }
  }, [message?.toolsData]);

  const handleThumbnailLoad = (index: number, thumbnailUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const newLoadedThumbnails = [...loadedThumbnails];
      newLoadedThumbnails[index] = true;
      setLoadedThumbnails(newLoadedThumbnails);
    };
    img.onerror = () => {
      console.error(`Failed to load thumbnail at index ${index}`);

      const newLoadedThumbnails = [...loadedThumbnails];
      newLoadedThumbnails[index] = true;
      setLoadedThumbnails(newLoadedThumbnails);
    };
    img.src = thumbnailUrl;
  };

  useEffect(() => {
    setLoadedThumbnails(new Array(message?.toolsData?.length).fill(false));
    
    message?.toolsData?.forEach((video, index) => {
      if (video.thumbnail_url) {
        handleThumbnailLoad(index, video.thumbnail_url);
      }
    });
  }, [message?.toolsData]);

  const handleThumbnailClick = (index: number) => {
    const newShowControls = [...showControls];
    newShowControls[index] = true;
    setShowControls(newShowControls);
    const actualIndex = showAllVideos ? index : Math.min(index, 2);
    handleVideoClick(actualIndex);
  };

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[12px] w-full">
        {message?.text && urlsFromMessageText.length > 0 && (
          <p className="text-[#333431] font-aeonik text-base">
            <AnimatedMessage text={message.text} />
          </p>
        )}
        {message && !message.isStreaming ? (
          <Suspense>
            {message?.text && message?.toolsData.length >= 1 && (
              <ThumbnailsList
                videos={message.toolsData}
                showAllVideos={showAllVideos}
                loadedThumbnails={loadedThumbnails}
                playerRefs={playerRefs}
                handleThumbnailClick={handleThumbnailClick}
              />
            )}
          </Suspense>
        ) : ''}
      </div>
      {videosLengthMoreThan3 && message?.text && (
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