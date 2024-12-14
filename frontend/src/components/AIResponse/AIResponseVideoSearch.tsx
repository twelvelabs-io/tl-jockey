import React, { Dispatch, SetStateAction, Suspense, useRef, useState, useEffect } from 'react'
import StreamingTextEffect from '../StreamingText/StreamingTextEffect';
import SeeMoreResultsButton from '../ChatMessagesList/SeeMoreResultsButton';
import ReactHlsPlayer from 'react-hls-player';
import { ReactComponent as PlayVideo } from '../../icons/PlayVideo.svg';
import { QuestionMessage } from '../../types/messageTypes';
import { formatTime } from '../ChatMessagesList/formatTime';
import { motion } from 'framer-motion';
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
  const [showHLS, setShowHLS] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHLS(true);
    }, 300); 

    return () => clearTimeout(timer);
  }, []);

  if (urlsFromMessageText.length === 0) {
    return null
  }

  const handleThumbnailClick = (index: number) => {
    const newShowControls = [...showControls];
    newShowControls[index] = true;
    setShowControls(newShowControls);
    handleVideoClick(index);
  };

  const playerRefs = urlsFromMessageText.map(() => useRef(null))
    return (
      <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[12px] w-full">
        { message  ?  
        <Suspense>
            {message?.text && message?.toolsData.length >= 1 && (
              <div className="grid grid-cols-3 gap-2 w-full">
                {message?.toolsData?.slice(0, showAllVideos ? undefined : 3).map((video, index) => (
                  <motion.div 
                    key={index} 
                    className="relative cursor-pointer"
                    onClick={() => handleThumbnailClick(index)}
                    initial={{ 
                      y: 20,
                      opacity: 0,
                      scale: 0.95
                    }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      scale: 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      mass: 0.5,
                      delay: index * 0.15
                    }}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { 
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        mass: 0.5,
                        duration: 0.2
                      }
                    }}
                  >
                    { showHLS ? (
                      <ReactHlsPlayer
                        key={index}
                        src={video.video_url}
                        width={'232px'}
                        controls={false}
                        height="128px"
                        playerRef={playerRefs[index]}
                        className={'rounded'}
                      />
                    ) : (
                      // Show placeholder while HLS loads
                      <div 
                        className="w-[182px] h-[88px] bg-gray-200 rounded relative gap-1"
                        style={{
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}

                      />
                    )}
                    {showHLS && (
                    <div className='border-gray-200 bg-grey'>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[34px] h-[34px] bg-[#FFFFFF] rounded-full flex items-center justify-center bg-opacity-60">
                          <PlayVideo className="w-[16px] h-[16px] opacity-30" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 bg-[#222222] bg-opacity-30 px-[4px] mr-[2px] mb-[4px] rounded pointer-events-none">
                        <span className="text-white text-sm font-aeonik">
                          {formatTime(video.start)}
                        </span>
                      </div>
                    </div>)}
                  </motion.div>
                ))}
              </div>
            )}
        </Suspense> : ''}
      </div>
      {videosLengthMoreThan3 && (
        <SeeMoreResultsButton
          showAllVideos={showAllVideos}
          setShowAllVideos={setShowAllVideos}
          message={message}
          videosUrls={urlsFromMessageText}
        />
      )}
      {message?.text && urlsFromMessageText.length > 0 && (
        <p className="text-[#333431] font-aeonik text-base">
          { <StreamingTextEffect text={message.link as any} />}
        </p>
      )}
      </div>
    )
}

export default AIResponseVideoSearch