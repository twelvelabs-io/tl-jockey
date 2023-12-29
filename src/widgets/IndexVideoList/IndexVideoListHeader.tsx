import React, { useEffect, useState } from 'react'
import { ReactComponent as YoutubeIcon } from '../../icons/video.svg'
import { ReactComponent as DeleteIcon } from '../../icons/delete.svg'
import Button from '@mui/material/Button'
import { Box, Modal, Typography } from '@mui/material'
import VideoListModal from './VideoListModal'

interface IndexVideoListHeader {
    cancelVideo: () => void
    videoNameMap: Record<string, number>
    activeVideoName: string | null
    onShowDeleteChange: (showDelete: boolean) => void
}

export enum VideoListHeaderTexts {
    UPLOADED_VIDEOS= 'Uploaded videos',
    VIDEOS_COUNT = "videos",
    TOTAL_VIDEOS = "Total",
    VIDEOS_SORTING = "Sort by :",
    VIDEOS_RECENT_UPLOAD = "Recent upload"
  }


const IndexVideoListHeader: React.FC<IndexVideoListHeader> = ({ cancelVideo, videoNameMap, activeVideoName, onShowDeleteChange }) => {
    const [open, setOpen] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const handleOpen = () => {
      setOpen(true);
    };

    const handleShowDelete = () => {
        showDelete === true ? setShowDelete(false) : setShowDelete(true)
    }

    useEffect(() => {
        onShowDeleteChange(showDelete)
    }, [showDelete])
  
    const handleClose = () => {
      setOpen(false);
    };

  return (
    <div className='flex flex-col sm:flex-row  justify-between items-center'>
        <div className={'flex flex-col sm:flex-row gap-4'}>
            <div className={'font-aeonikBold text-[16px] text-center'}>
                {VideoListHeaderTexts.UPLOADED_VIDEOS}
            </div>
            <div className={'flex flex-row gap-1 justify-center items-center'}>
                <YoutubeIcon/>
                <div className={'flex flex-row gap-1'}>
                    <p className={'font-aeonik text-sm text-[#6F706D]'}>11</p>
                    <div className={'font-aeonik text-sm text-[#6F706D]'}>
                        {VideoListHeaderTexts.VIDEOS_COUNT}
                    </div>
                    <div className={'font-aeonik text-sm text-[#6F706D]'}>
                        ({VideoListHeaderTexts.TOTAL_VIDEOS}
                    </div>
                    <p className={'font-aeonik text-sm text-[#6F706D]'}>1h 28min )</p>
                </div>
            </div>
            </div>
        <div>
    </div>
    <div className='flex flex-row gap-2 justify-center items-center cursor-pointer' onClick={handleShowDelete} >
        <p className={'font-aeonik text-sm text-[#6F706D]'}>{VideoListHeaderTexts.VIDEOS_SORTING}</p>
        <p className={'font-aeonik text-sm text-[#6F706D]'}>{VideoListHeaderTexts.VIDEOS_RECENT_UPLOAD}</p>
        <div className={'cursor-pointer'}>
            <DeleteIcon/>
        </div>
        {showDelete ?         
        <div onClick={handleOpen} className={'cursor-pointer'}>
            <p className={'font-aeonik text-sm text-[#6F706D]'}>Delete</p>
        </div> : ''
        }

    </div>
    <VideoListModal open={open} onClose={handleClose} cancelVideo ={cancelVideo} videoNameMap={videoNameMap} activeVideoName={activeVideoName} />
    </div>
  )
}

export default IndexVideoListHeader
