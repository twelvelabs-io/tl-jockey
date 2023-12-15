import { useState, useRef } from 'react'

interface UseVideoProps {
  videoFiles: string[]
  currentVideoFile: string
  chatContainerRef: React.MutableRefObject<HTMLDivElement | null>
  submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
}

interface UseVideo {
  valuesVideo: UseVideoProps
  actionsVideo: {
    setVideoFiles: React.Dispatch<React.SetStateAction<string[]>>
    setCurrentVideoFile: React.Dispatch<React.SetStateAction<string>>
  }
}

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
