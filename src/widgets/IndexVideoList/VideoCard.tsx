import React from 'react';
import EmptyVideoState from '../../components/EmptyVideoState/EmptyVideoState';
import ChooseVideo from '../../components/ChooseVideo/ChooseVideo';

interface VideoCardProps {
  video: { id: number; title: string; url: string };
  active: boolean;
  onClick: (videoId: number, videoName: string) => void;
  showDelete: boolean
}

const VideoCard: React.FC<VideoCardProps> = ({ video, active, onClick, showDelete }) => {
  return (
    <div className="video-card">
      <div className={'w-[332px] h-[208px] relative'}>
        <EmptyVideoState />
        { showDelete ?  (<div onClick={() => onClick(video.id, video.title)} className={'absolute top-3 right-3'}>
          <ChooseVideo initialStateActive={active} />
        </div>) : ''
        }
      </div>
      <h3 className="mt-2 text-[#6F706D] font-aeonik text-sm">{video.title}</h3>
    </div>
  );
};

export default VideoCard