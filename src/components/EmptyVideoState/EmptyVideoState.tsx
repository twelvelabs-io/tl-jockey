import React from 'react';
import { ReactComponent as EmptyVideoPaceholder } from '../../icons/EmptyVideoPlaceholder.svg';

interface EmptyVideoStateProps {
  duration?: number | string; // Add type declaration for duration
}

const EmptyVideoState: React.FC<EmptyVideoStateProps> = ({ duration }: EmptyVideoStateProps) => {
  const videoTotalHours = Number(duration) / 3600;
  const hours = Math.floor(videoTotalHours);
  const minutes = Math.round((videoTotalHours - hours) * 60);
  const seconds = videoTotalHours % 60
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  // example '01:03:48'
  return (
    <div className="flex flex-col justify-center items-center w-[332px] h-[208px]">
      <div className=' bg-[#F7F7FA] w-[332px] h-[186px] flex flex-col justify-center items-center rounded border'>
        <div className={'absolute top-5 bg-[#222222] opacity-60 rounded pr-2 pl-2 pt-1 pb-1'}>
          <p className={'text-white'}>
            {duration !== 0 ? duration : formattedTime}
          </p>
        </div>
        <EmptyVideoPaceholder />
        </div>
    </div>
  );
};

export default EmptyVideoState;