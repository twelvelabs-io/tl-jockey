import React from 'react';
import { ReactComponent as PlayVideo } from '../../icons/PlayVideo.svg';
import DummyVideoThumbnail from '../../icons/DummyVideoThumbnail';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface FallBackVideoSingleProps {
  index: number;
  duration: string;
  oneThumbnail?: boolean; // Marking it as optional
}

export const FallBackVideoSingle: React.FC<FallBackVideoSingleProps> = ({  index, duration, oneThumbnail }) => {
  return (
    <>
      <div className='relative cursor-pointer' >
      <DummyVideoThumbnail width='220' height='100'/>
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
      </div>
    </>
  );
};

export default FallBackVideoSingle;
