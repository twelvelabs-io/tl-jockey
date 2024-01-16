/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useState } from 'react'
import { ref } from 'firebase/storage'
import { VideoSelectState } from '../../constants'
import SelectVideoClip from '../../components/Select/SelectVideoClip'
import VideoBox from '../../components/VideoBox/VideoBox'
import { ActionType } from '../VideoAssistant/hooks/useChat'
import { type ActionMeta } from 'react-select'
import UploadVideoButton from './UploadVideoButton'
import { Link } from 'react-router-dom'

interface VideoSelectProps {
  chatDispatch: React.Dispatch<any>
  setCurrentVideoFile: (file: string) => void
  setShowAutofillQuestions: (show: boolean) => void
  videoRef: React.RefObject<HTMLVideoElement>
  getDownloadURL: (ref: any) => Promise<string>
  storage: any // Update with the correct type
  videoFiles: string[]
  currentVideoFile: string
}
type Option = any

const VideoSelect: React.FC<VideoSelectProps> = ({ chatDispatch, setCurrentVideoFile, setShowAutofillQuestions, videoRef, getDownloadURL, storage, videoFiles, currentVideoFile }) => {
  const [selectedOption, setSelectedOption] = useState<Option>(null)
  const handleVideoChange = (option: Option | null, actionMeta: ActionMeta<Option>) => {
    console.log(option?.value)
    console.log('change here')
    chatDispatch({ type: ActionType.SET_ARRAY_MESSAGES_CLEAN, payload: [] })
    chatDispatch({ type: ActionType.SET_LOADING, payload: false })
    chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: '' })
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
    setCurrentVideoFile('')
    setShowAutofillQuestions(false)

    const selectedVideoUrl = option?.value
    chatDispatch({ type: ActionType.SET_SELECTED_FILE, payload: selectedVideoUrl })
    if (videoRef.current) {
      console.log('yes')
      videoRef.current.src = selectedVideoUrl as string
      const fileRef = ref(storage, selectedVideoUrl as string)

      getDownloadURL(fileRef)
        .then((url) => {
          setCurrentVideoFile(url)
          console.log('File URL:', url)
        })
        .catch((error) => {
          console.error('Error getting file URL:', error)
        })
    }
    setSelectedOption(selectedVideoUrl)
  }
  const renderVideoOption = (videoFileName: string, index: number): JSX.Element => (
        <span className={'font-aeonik'} key={index}>{videoFileName}</span>
  )

  return (
    <>
    <div className={'p-6 max-h-[464px] flex-col flex'}>
          <div className={'flex flex-row justify-between'}>
            <div className={'h-5 font-bold text-[16px] font-aeonikBold'}>{VideoSelectState.CHOOSE_VIDEO}</div>
            <Link to="/Index">
              <UploadVideoButton/>
            </Link>
          </div>
          <div className={'relative inline-flex items-center'}>
            <SelectVideoClip
              data={videoFiles}
              className={'w-[324px] h-[48px] pt-2 pb-2 mt-2 mb-4 text-[16px]'}
              selectedOption={selectedOption as string}
              handleChange={handleVideoChange}
              renderOption={renderVideoOption}
            />
            {/* <div className={'relative right-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-solid border-gray-300'}>
              <ArrowIcon/>
            </div> */}
           </div>
         <VideoBox videoRef={videoRef} data={currentVideoFile}/>
        </div>
        </>
  )
}

export default VideoSelect
