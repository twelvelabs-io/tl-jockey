import type { VideoType } from './types'

import CloseIcon from '@mui/icons-material/CloseRounded'
import Tooltip from '@mui/material/Tooltip'
import clsx from 'clsx'
import { ReactComponent as Youtube} from '../../../icons/logo_youtube.svg'
import { Image } from '@mui/icons-material'
import React from 'react'

import { isFileType, isUrlType } from './types'

interface Props {
	video: VideoType
	onRemove: (id: string) => void
}

const UploadingVideo = ({ video, onRemove }: Props): JSX.Element => {
	const isVideoFile = isFileType(video)
	const isVideoUrl = isUrlType(video)
	const videoTitle = isVideoFile ? video.data.name : video.title

	return (
		<div
			className={clsx(
				'w-full md:w-[112px]',
				'mr-0 md:mr-2',
				'mt-0 md:mt-2',
				'relative',
				'flex items-center gap-2',
				'md:block'
			)}
			key={video.id}
		>
			<div className={clsx('h-8 md:h-16', 'w-[56px] md:w-[112px]', 'relative', 'rounded-[4px]', 'bg-grey-200')}>
				<Youtube
					className={clsx(
						'absolute left-1/2 top-1/2 z-10',
						'-translate-x-1/2 -translate-y-1/2 transform',
						'h-2/3 w-2/3'
					)}
				/>
				{isVideoFile && (
					<video
						className={clsx('relative z-20', 'rounded-[4px]')}
						src={video.blobUrl}
						width="100%"
						height="100%"
						muted
					/>
				)}
				{isVideoUrl && (
					<Image
						className={clsx('relative z-20', 'rounded-[4px]')}
					/>
				)}
			</div>
			<Tooltip title={videoTitle}>
				<div
					className={clsx(
						'flex-1',
						'text-ellipsis break-words',
                        'text-[12px]',
						'text-[#333431]',
						'text-body2 md:text-body3',
						'line-clamp-1',
						'md:line-clamp-2',
						'cursor-default',
						'mt-0 md:mt-1'
					)}
				>
					{videoTitle}
				</div>
			</Tooltip>
			<button
				className={clsx(
					'h-5 w-5 p-0',
					'static z-30',
					'-right-2 -top-2 md:absolute',
					'flex items-center justify-center',
					'bg-[#222222] opacity-60',
					'rounded-full border-none',
					'cursor-pointer'
				)}
				type="button"
				onClick={(): void => {
					onRemove(video.id)
				}}
			>
				<CloseIcon className="text-white rounded" fontSize="inherit" />
			</button>
		</div>
	)
}

export default UploadingVideo
