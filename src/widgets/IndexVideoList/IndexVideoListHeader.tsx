import React, { useEffect, useState } from 'react'
import { ReactComponent as YoutubeIcon } from '../../icons/video.svg'
import { ReactComponent as DeleteIcon } from '../../icons/delete.svg'
import { ReactComponent as ArrowIconDown } from '../../icons/ArrowDown.svg'
import { ReactComponent as WarningIcon } from '../../icons/Warning.svg'
import VideoListModal from './VideoListModal'
import { Alert } from '@mui/material'
import Warnings from '../../components/Warnings/Warnings'
import SelectVideoClip from '../../components/Select/SelectVideoClip'

interface IndexVideoListHeader {
    cancelVideo: () => void
    videoNameMap: Record<string, number>
    activeVideoName: string | null
    onShowDeleteChange: (showDelete: boolean) => void
    countOfVideo: number
}

export enum VideoListHeaderTexts {
    UPLOADED_VIDEOS= 'Uploaded videos',
    VIDEOS_COUNT = "videos",
    TOTAL_VIDEOS = "Total",
    VIDEOS_SORTING = "Sort by :",
    VIDEOS_RECENT_UPLOAD = "Recent upload"
  }

const IndexVideoListHeader: React.FC<IndexVideoListHeader> = ({ cancelVideo, videoNameMap, activeVideoName, onShowDeleteChange, countOfVideo }) => {
    const [open, setOpen] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showWarning, setShowWarning] = useState(false)
    const [currentFilterStatus, setCurrentFilterStatus] = useState(VideoListHeaderTexts.VIDEOS_RECENT_UPLOAD)
    const [selector, setSelector] = useState(false)

    const handleOpen = () => {
        activeVideoName !== null ? setOpen(true) : setOpen(false);
    };

    const handleShowDelete = () => {
        showDelete === true ? setShowDelete(false) : setShowDelete(true)
        showDelete === true && activeVideoName === null ? setShowWarning(true) : setShowWarning(false)
    }

    type Option = any

    useEffect(() => {
        !showWarning && onShowDeleteChange(showDelete)
    }, [showDelete])
  
    const handleClose = () => {
      setOpen(false);
    };

    const filterStates = [
        'Recent upload', 'Video duration', 'Video name', 'Video resolution'
    ]

    const handleFilterStatusChange = (option: Option) => {
        console.log(option?.value)
        setCurrentFilterStatus(option?.value)
    }

    const renderVideoOption = (videoFileName: string, index: number): JSX.Element => (
        <span className={'font-aeonik'} key={index}>{videoFileName}</span>
  )

  const handleOpenSelector = () => {
    selector === false ?  setSelector(true) :  setSelector(false)
  }


  return (
    <div>
        <div className='flex flex-col sm:flex-row  justify-between items-center'>
            <div className={'flex flex-col sm:flex-row gap-4'}>
                <div className={'font-aeonikBold text-[16px] text-center'}>
                    {VideoListHeaderTexts.UPLOADED_VIDEOS}
                </div>
                <div className={'flex flex-row gap-1 justify-center items-center'}>
                    <YoutubeIcon/>
                    <div className={'flex flex-row gap-1'}>
                        <p className={'font-aeonik text-sm text-[#6F706D]'}>{countOfVideo}</p>
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
        <div className='flex flex-row gap-2 justify-center items-center cursor-pointer' >
            <p className={'font-aeonik text-sm text-[#6F706D]'}>{VideoListHeaderTexts.VIDEOS_SORTING}</p>
            <div onClick={handleOpenSelector} className={'flex flex-col justify-center items-center gap-2 relative'}>
                <p className={'font-aeonik text-sm text-[#6F706D]'}>{currentFilterStatus}</p>
            </div>
            {!selector ? 
            <div className={'transform rotate-180'}>
                <ArrowIconDown/>
            </div>
            
            :<ArrowIconDown/> }
            {showDelete ?         
            <div onClick={handleClose} className={'cursor-pointer'}>
                <p className={'font-aeonik text-sm text-[#6F706D]'}>Clear</p>
            </div> : ''
            }
            <div className={'cursor-pointer'} onClick={handleShowDelete}>
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
        <div className={'flex justify-end items-center flex-row '}>
        {selector ?             
                    <SelectVideoClip
                        data={filterStates}
                        className={'w-[154px] h-[48px] pt-2 pb-2 mb-4 text-[16px] absolute mt-20 z-40'}
                        selectedOption={VideoListHeaderTexts.VIDEOS_RECENT_UPLOAD}
                        handleChange={handleFilterStatusChange}
                        renderOption={renderVideoOption}
                    /> :
                ""}
        </div>
        {showWarning && 
            <Warnings type="error"/>
        }
    </div>
  )
}

export default IndexVideoListHeader
