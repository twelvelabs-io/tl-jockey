import {useEffect} from 'react'

interface useVideoElementEffectProps {
	videoRef: React.RefObject<HTMLVideoElement>
	startTime: number
	endTime: number
	videoUrl: string
	showModal: boolean
}

export const useVideoElementEffect = ({videoRef, startTime, endTime, videoUrl, showModal}: useVideoElementEffectProps) => {
	useEffect(() => {
		const videoElement = videoRef.current
		const onLoadedMetadata = () => {
			if (startTime && videoElement) {
				videoElement.currentTime = startTime
			}
		}

		const onTimeUpdate = () => {
			if (endTime && videoElement && videoElement.currentTime >= endTime) {
				videoElement.pause()
			}
		}

		if (videoElement) {
			videoElement.addEventListener('loadedmetadata', onLoadedMetadata)
			videoElement.addEventListener('timeupdate', onTimeUpdate)

			return () => {
				videoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
				videoElement.removeEventListener('timeupdate', onTimeUpdate)
			}
		}
	}, [videoUrl, showModal, startTime, endTime])
}

export default useVideoElementEffect
