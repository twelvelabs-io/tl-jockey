// tl-jockey/frontend/src/components/AIResponse/VideoThumbnail.tsx
import React from 'react'
import {motion} from 'framer-motion'
import ReactHlsPlayer from 'react-hls-player'
import {ReactComponent as PlayVideo} from '../../icons/PlayVideo.svg'
import {formatTime} from '../ChatMessagesList/formatTime'

interface VideoThumbnailProps {
	video: any
	index: number
	actualIndex: number
	loadedThumbnails: boolean[]
	playerRef: any
	handleThumbnailClick: (index: number) => void
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({video, index, actualIndex, loadedThumbnails, playerRef, handleThumbnailClick}) => {
	return (
		<motion.div
			key={actualIndex}
			variants={{
				hidden: {opacity: 0, y: 20},
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: 0.5,
						ease: 'easeOut',
					},
				},
			}}
			className="relative cursor-pointer"
			onClick={() => handleThumbnailClick(actualIndex)}
			whileHover={{scale: 1.02}}
			whileTap={{scale: 0.98}}
		>
			<>
				<ReactHlsPlayer
					key={actualIndex}
					src={video.video_url}
					width={'232px'}
					controls={false}
					poster={video.thumbnail_url}
					height="128px"
					playerRef={playerRef}
					className="rounded"
				/>
				{loadedThumbnails && (
					<div className="border-gray-200 bg-grey">
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-[34px] h-[34px] bg-[#FFFFFF] rounded-full flex items-center justify-center bg-opacity-60">
								<PlayVideo className="w-[16px] h-[16px] opacity-60" />
							</div>
						</div>
						<div
							className="absolute bottom-0 right-0 px-[4px] mr-[2px] mb-[4px] rounded pointer-events-none"
							style={{background: 'rgba(34, 34, 34, 0.60)'}}
						>
							<span className="text-white text-sm font-aeonik">{formatTime(video.start)}</span>
						</div>
					</div>
				)}
			</>
		</motion.div>
	)
}

export default VideoThumbnail
