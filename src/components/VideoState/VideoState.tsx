/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useEffect, useState } from 'react';
import { ReactComponent as EmptyVideoPaceholder } from '../../icons/EmptyVideoPlaceholder.svg';
import VideoPlayerCard from './VideoPlayerCard';
import useGetVideoFromIndex from './hooks/useGetVideoFromIndex';

interface VideoStateProps {
  index_id: string | number
}

const apiKey = process.env.REACT_APP_API_MAIN_KEY;
const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

const VideoState: React.FC<VideoStateProps> = ({ index_id }: VideoStateProps) => {
  const videoStateInfo = useGetVideoFromIndex(index_id)
  return (
    <div>
        {videoStateInfo ? <VideoPlayerCard index_id={index_id} video_id={videoStateInfo}/> : ''}
    </div>
  );
};

export default VideoState