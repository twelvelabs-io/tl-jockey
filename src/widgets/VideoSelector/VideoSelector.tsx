/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useState } from 'react'
import { VideoSelectState } from '../../constants'
import SelectVideoClip from '../../components/Select/SelectVideoClip'
import VideoBox from '../../components/VideoBox/VideoBox'
import { ActionType } from '../VideoAssistant/hooks/useChat'
import { type ActionMeta } from 'react-select'
import UploadVideoButton from './UploadVideoButton'
import { Link } from 'react-router-dom'
import useGetSummarize from './hooks/useGetSummarize'

interface VideoData {
  url: string;
  id: string;
  filename: string;
  summary: string;
}

interface VideoSelectProps {
  chatDispatch: React.Dispatch<any>
  setCurrentVideoFile: (file: string) => void
  setShowAutofillQuestions: (show: boolean) => void
  videoRef: React.RefObject<HTMLVideoElement>
  getDownloadURL: (ref: any) => Promise<string>
  videoFiles: string[]
  currentVideoFile: string
}
type Option = any

const VideoSelect: React.FC<VideoSelectProps> = ({ chatDispatch, setCurrentVideoFile, setShowAutofillQuestions, videoRef, getDownloadURL, videoFiles, currentVideoFile }) => {
  const summarizeResultId: VideoData[] = useGetSummarize()
  const [selectedOption, setSelectedOption] = useState<string | undefined>(summarizeResultId?.[0]?.url)

  const handleVideoChange = (option: Option | null, actionMeta: ActionMeta<Option>) => {

    chatDispatch({ type: ActionType.SET_ARRAY_MESSAGES_CLEAN, payload: [] })
    chatDispatch({ type: ActionType.SET_LOADING, payload: false })
    chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: '' })
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
    setCurrentVideoFile('')
    setShowAutofillQuestions(false)

    const selectedVideoUrl = summarizeResultId.find((element) => element.filename === option.value)?.url || '';
    const selectedVideoUrlData = summarizeResultId.find((element) => element.filename === option.value) || ''
    console.log(selectedVideoUrlData)
    console.log(selectedVideoUrl)

    chatDispatch({ type: ActionType.SET_SELECTED_FILE, payload: selectedVideoUrl })
    chatDispatch({ type: ActionType.SET_SELECTED_FILE_DATA, payload: selectedVideoUrlData })
    if (videoRef.current) {
      console.log('yes')
      videoRef.current.src = selectedVideoUrl as string
      setCurrentVideoFile(selectedVideoUrl)
    }
    setSelectedOption(selectedVideoUrl)
  }
  const renderVideoOption = (videoFileName: string, index: number): JSX.Element => (
        <span className={'font-aeonik'} key={index}>{videoFileName}</span>
  )
  
  const filenames = summarizeResultId.map(result => result.filename)
  console.log(summarizeResultId)

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
              data={filenames}
              className={'w-[324px] h-[48px] pt-2 pb-2 mt-2 mb-4 text-[16px]'}
              selectedOption={selectedOption as string}
              handleChange={handleVideoChange}
              renderOption={renderVideoOption}
            />
           </div>
         <VideoBox videoRef={videoRef} data={selectedOption}/>
        </div>
        </>
  )
}

export default VideoSelect
