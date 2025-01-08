import React, {useState} from 'react'
import {ReactComponent as PlayVideoSmall} from '../../icons/PlayVideoSmall.svg'
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface ThumbnailProps {
	thumbnailUrl: string | undefined
	onClick: () => void
	duration: string
	oneThumbnail?: boolean
	text: string
}

export const Thumbnail: React.FC<ThumbnailProps> = ({thumbnailUrl, onClick, duration, text}) => {
	return (
		<div className="flex flex-row gap-1 cursor-pointer" onClick={onClick}>
			<div className="relative cursor-pointer">
				<img src={thumbnailUrl} className={'rounded max-w-[102px] max-h-[56px]'} />
				<div className="opacity-60 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<PlayVideoSmall />
				</div>
				<div className="absolute top-0 right-0 pr-[4px] pl-[4px] pt-[2px] pb-[2px] bg-[#22222299] rounded-bl rounded-tr">
					<p className="text-[12px] font-aeonik text-[#FFFFFF]">{duration}</p>
				</div>
			</div>
			<div>
				<p className="font-aeonik font-normal text-sm text-[#585956] truncate-lines">{text}</p>
			</div>
		</div>
	)
}

export default Thumbnail
