import React, { useState } from 'react'
import IndexVideoListHeader from './IndexVideoListHeader'
import { ReactComponent as ArrowIconLeft } from '../../icons/ChevronLeft.svg'
import { ReactComponent as ArrowIconRight } from '../../icons/ChevronRight.svg'
import { useArrayHook } from './hooks/useArrayHook'
import ChooseVideo from '../../components/ChooseVideo/ChooseVideo'
import EmptyVideoState from '../../components/EmptyVideoState/EmptyVideoState'
import { Alert } from '@mui/material'
interface IndexVideoList {
}

const dummyVideoList = [
    { id: 1, title: 'Video 1', url: 'https://example.com/video1.mp4' },
    { id: 2, title: 'Video 2', url: 'https://example.com/video2.mp4' },
    { id: 3, title: 'Video 3', url: 'https://example.com/video1.mp4' },
    { id: 4, title: 'Video 4', url: 'https://example.com/video2.mp4' },
    { id: 5, title: 'Video 5', url: 'https://example.com/video1.mp4' },
    { id: 6, title: 'Video 6', url: 'https://example.com/video2.mp4' },
    { id: 7, title: 'Video 7', url: 'https://example.com/video1.mp4' },
    { id: 8, title: 'Video 8', url: 'https://example.com/video2.mp4' },
    { id: 9, title: 'Video 9', url: 'https://example.com/video1.mp4' },
    { id: 10, title: 'Video 10', url: 'https://example.com/video2.mp4' },
    { id: 11, title: 'Video 11', url: 'https://example.com/video1.mp4' },
    { id: 12, title: 'Video 12', url: 'https://example.com/video2.mp4' },
    { id: 13, title: 'Video 13', url: 'https://example.com/video2.mp4' },
    { id: 14, title: 'Video 14', url: 'https://example.com/video1.mp4' },
    { id: 15, title: 'Video 15', url: 'https://example.com/video2.mp4' },
    { id: 16, title: 'Video 16', url: 'https://example.com/video2.mp4' },
    { id: 17, title: 'Video 17', url: 'https://example.com/video1.mp4' },
    { id: 18, title: 'Video 18', url: 'https://example.com/video2.mp4' },
    { id: 19, title: 'Video 19', url: 'https://example.com/video2.mp4' },
    { id: 20, title: 'Video 20', url: 'https://example.com/video1.mp4' },
    { id: 21, title: 'Video 21', url: 'https://example.com/video2.mp4' },
  ];

const IndexVideoList: React.FC<IndexVideoList> = () => {
  const { videoList, addVideo, cancelVideo } = useArrayHook(dummyVideoList)
  const [videoNameMap, setVideoNameMap] = useState<Record<string, number>>({})
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [activeVideoName, setActiveVideoName] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  // Function to handle video click
  const handleVideoClick = (videoId: number, videoName: string) => {
    setActiveVideo(videoId);
    setVideoNameMap((prevMap) => ({
      ...prevMap,
      [videoName]: videoId,
    }));
    setActiveVideoName(videoName)
  };
  // Pagination
  const itemsPerRow = 3; // Adjust this based on the number of videos per row you want
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVideoList = videoList.slice(startIndex, endIndex);

  const totalPages = Math.ceil(dummyVideoList.length / itemsPerPage);
  const showArrows = totalPages > 3;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleCancelVideo = () => {
    if (activeVideo !== null) {
      cancelVideo(activeVideo)
      setShowAlert(true)
      setTimeout(() => {
        setShowAlert(false);
      }, 2000);
    }
  }

  const handleShowDeleteChange = (showDelete: boolean) => {
    console.log('showDelete changed:', showDelete)
    setShowDelete(showDelete)
  };

  return (
    <div className={'p-6 border-b-[1px] border-[#E5E6E4] flex flex-col gap-4'}>
      <IndexVideoListHeader 
        cancelVideo={handleCancelVideo} 
        videoNameMap={videoNameMap} 
        activeVideoName={activeVideoName}
        onShowDeleteChange={handleShowDeleteChange}/>
      {showAlert && (
        <Alert icon={false} severity="success" className={'w-full'}>
          <p className={'font-aeonik text-sm text-gray-700'}>
            Video deleted successfully!
          </p>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mx-auto sm:ml-0">
        {currentVideoList.map((video) => (
          <div key={video.id} className="video-card">
            <div className={'w-[332px] h-[208px] relative'}>
              <EmptyVideoState/>
              {showDelete && 
              <div onClick={() => handleVideoClick(video.id, video.title)} className={'absolute top-3 right-3'}>
                    <ChooseVideo initialStateActive={activeVideo === video.id} />
              </div> 
              }
            </div>
            {/* <video controls className={'w-[40vw] h-[45vh]'}>
                <div onClick={() => handleVideoClick(video.id)} className={'absolute top-0 right-0'}>
                    <ChooseVideo initialStateActive={activeVideo === video.id} />
                </div>
              <source src={video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video> */}
            <h3 className="mt-2 text-[#6F706D] font-aeonik text-sm">{video.title}</h3>
          </div>
        ))}
      </div>

      {/* Pagination with Arrows */}
      <div className="flex items-center justify-center mt-4">
        {showArrows && currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700"
          >
            <ArrowIconLeft/>
          </button>
        )}

        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`mx-2 px-4 py-2 rounded-[32px] ${
              currentPage === index + 1 ? 'bg-[#F7F7FA] rounded-2xl' : ''
            }`}
          >
            {index + 1}
          </button>
        ))}

        {showArrows && currentPage < totalPages && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700"
          >
            <ArrowIconRight/>
          </button>
        )}
      </div>
    </div>
  )
}

export default IndexVideoList
