import React from 'react';
import { ReactComponent as LogoIcon } from '../../icons/logo.svg';
import { Link } from 'react-router-dom';

const VideoAssistantHeader = () => {
  return (
    <div className=" text-center justify-between flex p-6 border-b-[1px] border-[#E5E6E4]">
      <Link to="/Chat">
        <LogoIcon />
      </Link>
    </div>
  );
};

export default VideoAssistantHeader;