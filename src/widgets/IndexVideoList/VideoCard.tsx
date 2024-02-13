import React from 'react';
import EmptyVideoState from '../../components/EmptyVideoState/EmptyVideoState';
import ChooseVideo from '../../components/ChooseVideo/ChooseVideo';
import VideoState from '../../components/VideoState/VideoState';
import useGetVideosForIndex from './hooks/useGetVideosForIndex';

interface VideoCardProps {
  active: boolean;
  onClick: (videoId: number, videoName: string, index: string) => void;
  showDelete: boolean
  video: VideoFile
}

interface VideoFile {
    thumbnail: string;
    created_at: string;
    engines: any[]; 
    expires_at: string;
    index_name: string;
    total_duration: number;
    updated_at: string;
    video_count: number;
    _id: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ active, onClick, showDelete, video }) => {
    const { videoData, loading, error } = useGetVideosForIndex(video)
    const handleDelete = async () => {
        onClick(video._id, video.index_name,String(videoData?._id))
    };
      
  return (
    <div className="video-card">
      <div className={'w-[332px] h-[208px] relative'}>
        {video.total_duration > 0 ?<VideoState index_id={video._id}/> : <EmptyVideoState duration={video.total_duration} />}

        { showDelete ?  (<div onClick={handleDelete} className={'absolute top-5 right-3'}>
          <ChooseVideo initialStateActive={active} />
        </div>) : ''
        }
      </div>
      <h3 className="mt-2 text-[#6F706D] font-aeonik text-sm overflow-hidden h-[2.5em]">
            <span className="block overflow-hidden text-overflow-ellipsis w-[250px]">
            {video.index_name}
            </span>
        </h3>
    </div>
  );
};

export default VideoCard