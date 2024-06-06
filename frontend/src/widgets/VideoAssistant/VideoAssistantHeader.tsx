import React from 'react';
import { ReactComponent as LogoIcon } from '../../icons/logo.svg';

const VideoAssistantHeader = ({ handleClickOnChat }: { handleClickOnChat: () => void }) => {
  return (
    <div className=" text-center pl-[20px] border-b-[1px] border-[#E5E6E4]">
      <div className='h-[56px] flex items-center hover:cursor-pointer' onClick={handleClickOnChat}>
          <LogoIcon />
      </div>
    </div>
  );
};

export default VideoAssistantHeader;