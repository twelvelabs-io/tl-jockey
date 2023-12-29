/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { VideoType } from './types'
import type { Theme } from '@mui/material'

import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import LinkIcon from '@mui/icons-material/Link'
import useMediaQuery from '@mui/material/useMediaQuery'
import clsx from 'clsx'
import React, { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import pluralize from "./pluralize"

import UploadingVideo from './UploadingVideo'

type IconWrapperProps = { className?: string; children: React.ReactNode; isDragReject: boolean; isDragAccept: boolean }
const IconWrapper = ({ className, children, isDragReject, isDragAccept }: IconWrapperProps): JSX.Element => (
	<div
		className={clsx(
			className,
			'h-10 w-10',
			'bg-[#929490]',
			'flex items-center justify-center',
			'text-[24px] text-white',
			'rounded-full',
			isDragAccept && '!bg-green-500',
			isDragReject && '!bg-red-500'
		)}
	>
		{children}
	</div>
)

type TextButtonProps = { className?: string; children: React.ReactNode; onClick?: () => void }
const TextButton = ({ className, children, onClick }: TextButtonProps): JSX.Element => (
	<button
		className={clsx(className, 'cursor-pointer', 'border-none', 'bg-transparent', 'p-0')}
		onClick={onClick}
		type="button"
	>
		{children}
	</button>
)

const MAX_VIDEO_SIZE = 1024 * 1024 * 1024 * 2 // 2GB
const MAX_VIDEO_SIZE_TEXT = '2GB'

type RejectedFile = {
	fileName: string
	reason: string
}

type Props = {
	className?: string
	onDrop: (files: Array<File>) => void
	onRemove: (id: string) => void
	videos: Array<VideoType>
}

const VideoDropZone = ({ className, onDrop, onRemove, videos }: Props): JSX.Element => {
	// const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
    const isMobile = false
	const [rejectedFiles, setRejectedFiles] = useState<Array<RejectedFile>>([])

	const {
		isDragAccept,
		isDragReject,
		getRootProps,
		getInputProps,
		isDragActive,
		open: openFileDialog
	} = useDropzone({
		accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
		maxSize: MAX_VIDEO_SIZE,
		noClick: videos.length > 0,
		onDrop,
		onDropAccepted: () => {
			setRejectedFiles([])
		},
		onDropRejected: (rejected) => {
			setRejectedFiles((f) => [
				...f,
				...rejected.map(({ file, errors }) => ({
					fileName: file.name,
					reason: errors[0].code
				}))
			])
		}
	})

	const exceedMaxSize = rejectedFiles.some((f) => f.reason === 'file-too-large')
	const dragFailed = exceedMaxSize || isDragReject

	const dropzoneCenterMessage = useMemo((): JSX.Element => {
		if (exceedMaxSize) {
			return (
				<div className="text-body2 font-medium text-red-500">
					You can only upload files less than {MAX_VIDEO_SIZE_TEXT}
				</div>
			)
		}

		if (isDragReject) {
			return <div className="text-body2 font-medium text-red-500">You can only upload video files</div>
		}

		if (isDragAccept) {
			return <div className="text-body2 font-medium text-green-800">Drop here!</div>
		}

		if (isMobile) {
			return <TextButton className="text-subtitle3 font-medium text-green-800">Browse files</TextButton>
		}

		return (
			<>
				<div className="text-body2 text-[#929490] text-sm">
					Drag and drop videos here <br />
				</div>
				<div className="text-body2 text-[#929490] text-sm">
					or&nbsp;
					<TextButton className="text-body2 font-medium text-green-800">Browse files</TextButton>
				</div>
			</>
		)
	}, [isDragAccept, isDragReject, exceedMaxSize, isMobile])

	const [bgColor, bgBorderColor] = useMemo(() => {
		if (isDragAccept) {
			// # in URL starts a fragment identifier, hence escape it with %23 instead
			return ['%23F7FEF2', '%239AED59'] // green-50, green-500
		}

		if (isDragReject) {
			return ['%23FEF0EF', '%23F44336'] // red-50, red-500
		}

		return ['none', '%23C5C7C3'] // none, grey-400
	}, [isDragAccept, isDragReject])

	return (
		<div
			className={clsx(className, 'overflow-auto', 'flex items-stretch', 'h-[300px]')}
			style={{
				// Native CSS properties don't support the customization of border-style.
				// Therefore, we use a trick with an SVG image inside background-image property.
				// Reference: https://kovart.github.io/dashed-border-generator/
				backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='${bgColor}' stroke='${bgBorderColor}' stroke-width='4' stroke-dasharray='4%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`
			}}
			{...getRootProps()}
		>
			<input {...getInputProps()} />
			{videos.length > 0 && !isDragActive ? (
				<div className={clsx('w-full', 'px-4 pb-5 pt-3')}>
					<div className="flex justify-between">
						<span className="text-body2 text-[#929490] text-sm ">{pluralize(videos.length, 'video')}</span>
						<TextButton className="text-subtitle3 font-medium text-green-800" onClick={openFileDialog}>
							Browse files
						</TextButton>
					</div>
					<div className={clsx('flex flex-wrap gap-2', 'py-2')}>
						{videos.map((video) => (
							<UploadingVideo video={video} onRemove={onRemove} />
						))}
					</div>
				</div>
			) : (
				<div className={clsx('w-full', 'flex flex-col items-center justify-center')}>
					<div className={clsx('flex gap-1', 'mb-2')}>
						<IconWrapper isDragAccept={isDragAccept} isDragReject={dragFailed}>
							<CreateNewFolderIcon />
						</IconWrapper>
						<IconWrapper className="relative bottom-6" isDragAccept={isDragAccept} isDragReject={dragFailed}>
							<CloudUploadIcon />
						</IconWrapper>
						<IconWrapper isDragAccept={isDragAccept} isDragReject={dragFailed}>
							<LinkIcon />
						</IconWrapper>
					</div>
					{dropzoneCenterMessage}
				</div>
			)}
		</div>
	)
}

export default VideoDropZone
