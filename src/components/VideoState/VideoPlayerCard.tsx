/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent as EmptyVideoPaceholder } from '../../icons/EmptyVideoPlaceholder.svg';
import ReactHlsPlayer from 'react-hls-player';
import useGetUrlFromVideo from './hooks/useGetUrlFromVideo';

interface VideoStateProps {
  index_id: string | number
  video_id: string | number
}

const VideoPlayerCard: React.FC<VideoStateProps> = ({ index_id, video_id }: VideoStateProps) => {
  const videoStateUrl = useGetUrlFromVideo(index_id, video_id)
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className=" flex flex-row justify-center items-center w-[332px] h-[208px] ">
      <ReactHlsPlayer 
        className=" rounded"
        src={String(videoStateUrl)}
        autoPlay={false}
        controls={true}
        width="100%"
        height="auto"
        playerRef={videoRef}  
      />
    </div>
  );
};

export default VideoPlayerCard