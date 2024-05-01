import React, { useState } from 'react';
import { ReactComponent as PlayVideo } from '../../icons/PlayVideo.svg';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface VideoThumbnailProps {
  thumbnailUrl: string | undefined;
  index: number;
  onClick: () => void;
  duration: string;
  oneThumbnail?: boolean; // Marking it as optional
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ thumbnailUrl, index, onClick, duration, oneThumbnail }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <>
      <div className='relative cursor-pointer' onClick={onClick}>
        <img
          src={thumbnailUrl}
          key={index}
          className={"rounded p-[0.5px]" + (oneThumbnail ? 'w-full h-full' : 'w-[220px] h-[122px]')}
          onLoad={handleImageLoad}
        />
        { isLoaded && 
        <>
            <div className='absolute top-0 left-0 mt-2 ml-2 pr-[10px] pl-[10px] pt-[4px] pb-[4px] w-5 h-5 bg-[#22222299] rounded-2xl flex flex-row justify-center items-center'>
                <p className='text-[12px] font-aeonik text-[#FFFFFF]'>
                    {index + 1}
                </p>
            </div>
            <div className='opacity-60 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                <PlayVideo />
            </div>
            <div className='absolute top-0 right-0 pr-[4px] pl-[4px] pt-[2px] pb-[2px] bg-[#22222299] rounded-bl-lg rounded-tr-lg'>
                <p className='text-[12px] font-aeonik text-[#FFFFFF]'>
                    {duration}
                </p>
            </div>
        </>
        }
      </div>
    </>
  );
};

export default VideoThumbnail;
