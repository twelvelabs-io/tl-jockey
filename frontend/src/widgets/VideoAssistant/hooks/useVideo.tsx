import { useState, useRef } from 'react'

import { UseVideo } from './useVideoTypes'

function useVideo (): UseVideo {
  const [videoFiles, setVideoFiles] = useState<string[]>([])
  const [currentVideoFile, setCurrentVideoFile] = useState<string>('')
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const submitButtonRef = useRef<HTMLButtonElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  return {
    valuesVideo: {
      videoFiles,
      currentVideoFile,
      chatContainerRef,
      submitButtonRef,
      videoRef
    },
    actionsVideo: {
      setVideoFiles,
      setCurrentVideoFile
    }
  }
}

export default useVideo
