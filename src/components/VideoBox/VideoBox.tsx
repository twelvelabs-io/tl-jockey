/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react'
import { VideoSelectState } from '../../constants'

interface VideoBoxProps<T> {
  videoRef: React.RefObject<HTMLVideoElement>
  data: T
}

const VideoBox = <T,>({ videoRef, data }: VideoBoxProps<T>): JSX.Element => {
  return (
      <>
        <video ref={videoRef} controls width="0" height="0" />
        { data
          ? (
          <video ref={videoRef} controls className={'w-[40vw] h-[45vh]'}>
            <source key={String(data)} src={String(data)} type="video/mp4" />
          </video>
            )
          : (
          <div className={'w-[40vw] h-[45vh] bg-green-200 flex justify-center items-center'}>
            {/* Content for the empty state */}
            {VideoSelectState.NO_VIDEO_SELECTED}
          </div>
            )
        }
      </>
  )
}

export default VideoBox
