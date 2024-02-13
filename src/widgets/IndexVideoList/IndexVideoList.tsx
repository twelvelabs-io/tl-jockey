import React, { useCallback, useState } from 'react'
import IndexVideoListHeader from './IndexVideoListHeader'
import { useVideoList } from './hooks/useVideoList'
import { Alert } from '@mui/material'
import VideoCard from './VideoCard'
import useRetrieveVideoList from './hooks/useRetriveVideoList'
import Pagination from '../../components/Pagination/Pagination'
interface IndexVideoList {
}

export type VideoChooseType = {
  index: number;
  name: string;
  videoId: string;
};

export enum Page {
  ITEMS_PER_PAGE = 12,
  SHOW_ARROWS_NUMBER = 3,
  FIRST_PAGE = 1,
}

export enum Time {
  SECONDS_IN_ONE_HOUR = 3600,
  ZERO = 0,
  MINUTES_IN_ONE_HOUR = 60,
}

export enum StatusDelete {
  DELETE_SUCESS = 'Video deleted successfully!'
}

const IndexVideoList: React.FC<IndexVideoList> = () => {
  const { videoList, addVideo, cancelVideo, addFullList, sortList } = useVideoList([])
  const [videoNameChoose, setVideoChoose] = useState<VideoChooseType | undefined>()
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [activeVideoName, setActiveVideoName] = useState<string | null>(null);

  const [currentFilterStatus, setCurrentFilterStatus] = useState<string>('')
  const [showAlert, setShowAlert] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);

  const handleVideoClick = (videoId: number, videoName: string, video: string) => {
    setActiveVideo(videoId);
    setVideoChoose({
      index: videoId,
      name: videoName,
      videoId: video,
    });
    setActiveVideoName(videoName)
  };

  const itemsPerPage = Page.ITEMS_PER_PAGE;

  const startIndex = (currentPage - Page.FIRST_PAGE) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVideoList = videoList.slice(startIndex, endIndex);

  const totalPages = Math.ceil(videoList.length / itemsPerPage);
  const showArrows = totalPages > Page.SHOW_ARROWS_NUMBER;

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleCancelVideo = useCallback(() => {
    if (activeVideo !== null) {
      cancelVideo(activeVideo);
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 2000);
    }
  }, [activeVideo, cancelVideo]);

  const handleShowDeleteChange = useCallback((showDelete: boolean) => {
    setShowDelete(showDelete);
  }, []);

  useRetrieveVideoList(currentPage, addFullList, currentFilterStatus, sortList)

  const handleFilterChange = useCallback((newFilterStatus: string) => {
    setCurrentFilterStatus(newFilterStatus);
  }, []);

  function formatDuration(totalHours: number) {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * Time.MINUTES_IN_ONE_HOUR);
    return `${hours}h ${minutes}min`;
  }
  
  const videoTotalHours = videoList.reduce((sum, video) => sum + video.total_duration / Time.SECONDS_IN_ONE_HOUR, Time.ZERO);

  const videoTotalHoursformatted = formatDuration(videoTotalHours);
  
  console.log(videoList)
  return (
    <div className={'p-6 border-b-[1px] border-[#E5E6E4] flex flex-col gap-4'}>
      <IndexVideoListHeader 
        onFilterChange={handleFilterChange} 
        countOfVideo={videoList?.length}
        cancelVideo={handleCancelVideo} 
        videoTotalHoursformatted={videoTotalHoursformatted}
        videoNameChoose={videoNameChoose} 
        activeVideoName={activeVideoName}
        onShowDeleteChange={handleShowDeleteChange}/>
      {showAlert && (
        <Alert icon={false} severity="success" className={'w-full'}>
          <p className={'font-aeonik text-sm text-gray-700'}>
            {StatusDelete.DELETE_SUCESS}
          </p>
        </Alert>
      )}
      <div className="flex flex-row flex-wrap gap-4 justify-center items-center sm:justife-start sm:items-start md:justify-start">
        {currentVideoList.map((video) => (
          <VideoCard
            video={video}
            key={video._id}
            active={activeVideo === video._id}
            onClick={handleVideoClick}
            showDelete={showDelete}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        showArrows={showArrows}
        handlePageChange={handlePageChange}
      />
    </div>
  )
}

export default IndexVideoList
