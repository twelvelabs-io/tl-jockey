/* eslint-disable @typescript-eslint/strict-boolean-expressions */
// VideoListModal.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import YoutubeUrlForm from './YoutubeUrlForm';
import VideoDropZone from './VideoDropZone';
import { VideoType, isFileType, isUrlType } from './types';
import { nanoid } from 'nanoid'
import Dialog from './Dialog';
import SupportedVideoInfo from './SupportedVideoInfo';
import { useQueryClient } from 'react-query';
import { FileId, useSetIndexTaskUpload } from './indexTaskUploadState';
import axios from 'axios';
import useVideoUpload from '../../../apis/useVideoUpload';
import { useCreateTask, useCreateTaskWithUrl } from '../../../apis/hooks';

interface DropZoneModalProps {
  open: boolean;
  onClose: () => void
}

export enum DropZoneModalTexts {
    UPLOAD_VIDEOS = "Upload videos",
    UPLOAD = "Upload",
    CANCEL = "Cancel"
  }

const DropZoneModal: React.FC<DropZoneModalProps> = ({ open, onClose }) => {
  const setUploadTask = useSetIndexTaskUpload()
  const [indexesList, setIndexesList] = useState<number[]>([])
  const { uploadVideos } = useVideoUpload()
  const uploadVideoFiles = useCreateTask()
  const uploadWithUrl = useCreateTaskWithUrl()
  const [videos, setVideos] = useState<Array<VideoType>>([])
  console.log(videos)
  const styleForModal = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'w-[1000px]',
    height: 'h-[800px]',
    bgcolor: 'background.paper',
    boxShadow: 10,
    p: 4,
  };

  const onDrop = (acceptedFiles: Array<File>): void => {
    const newFiles = acceptedFiles.map((file) => ({
        type: 'file' as const,
        id: nanoid(),
        data: file,
        blobUrl: URL.createObjectURL(file)
    }))

    setVideos((prev) => [...prev, ...newFiles])
    }
const onRemove = (id: string): void => {
    setVideos((prev) => prev.filter((video) => video.id !== id))
}


const onAddClick = (data: { url: string; title: string; thumbnailUrl: string }): void => {
    const newUrl = {
        type: 'url' as const,
        id: nanoid(),
        ...data
    }
    setVideos((prev) => [...prev, newUrl])
}

useEffect(() => {
    uploadVideos(videos).then((indexes) => {
        console.log(indexes)
        setIndexesList(indexes)
    })
}, [videos])

const upload = () => {

    // const handleError = (fileId: FileId, error: unknown): void => {
    //     const networkError = error as TwelveLabsApiError
    //     if (networkError.isAxiosError && networkError.response) {
    //         const { code } = networkError.response.data
    //         if (code === TaskErrorCode.UsageLimitExceeded) {
    //             showUsageLimitAlertDialog(true)
    //         }
    //         setUploadTask({ fileId, code: code as TaskErrorCode | undefined })
    //     }
    // }

    Promise.all(
        videos.map(async (video, index) => {
            const fileId = video.id as FileId
            const controller = new AbortController()
            let taskId = ''

            try {
                if (isFileType(video)) {
                    console.log('file type is flei')
                    const result = await uploadVideoFiles.mutateAsync({
                        index_id: String(indexesList[0]),
                        video_file: video.data,
                        language: 'en',
                        abortSignal: controller.signal,
                        onUploadProgress: ({ loaded, total }: any) => {
                            console.log({ fileId, progress: Math.round((loaded * 100) / total) })
                        }
                    })
                    console.log('result')
                    console.log(result)
                    taskId = result._id
                }

                if (isUrlType(video)) {
                    console.log('check it is url')
                    const result = await uploadWithUrl.mutateAsync({
                        index_id: String(indexesList[0]),
                        url: video.url,
                        abortSignal: controller.signal
                    })
                    taskId = result._id
                    console.log('youtube url')
                    console.log({ fileId, progress: 100 })
                }

            } catch (error) {
                console.log('error')
            }
            onClose()
        })
    )


}
	
console.log(videos)
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >

      <Box sx={styleForModal}>
        <Typography className={'mb-4'}>
            <p className={'font-aeonikBold text-xl'}>{DropZoneModalTexts.UPLOAD_VIDEOS}</p>
        </Typography>
        <SupportedVideoInfo className="mb-2 md:mb-6" />
        <YoutubeUrlForm onAddClick={onAddClick}/>
        <VideoDropZone className="flex-1 md:basis-[290px] mt-4" videos={videos} onDrop={onDrop} onRemove={onRemove} />
        <div className={'mt-4 flex flex-row justify-between items-center'}>
            <Button onClick={onClose} className={'hover:bg-[#E5E6E4] py-3'}>
                <p className={'font-aeonik text-sm text-[#6F706D]'}>{DropZoneModalTexts.CANCEL}</p>
            </Button>
            <Button onClick={upload } className={'flex flex-row justify-center items-center '}>
                <p className={'p-[10px] bg-[#E5E6E4] font-aeonik text-sm text-[#6F706D]'}>{DropZoneModalTexts.UPLOAD}</p>
            </Button>
        </div>
      </Box>


    </Modal>
  );
};

export default DropZoneModal
