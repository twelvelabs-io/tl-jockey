/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { AxiosError } from 'axios'

import AddIcon from '@mui/icons-material/Add'
import { Skeleton } from '@mui/material'
import { useYoutubeMetadata } from '../../../apis/ChatApiHandler/hooks/hooks'
import clsx from 'clsx'
import Input from '../../../components/InputDropZone/InputDropZone'
import { ReactComponent as YoutubeLogo} from '../../../icons/logo_youtube.svg'
import { Image } from '@mui/icons-material'
import React, { useMemo, useState } from 'react'

/**
 * Accepted URL patterns are:
 *
 * Normal Url: https://www.youtube.com/watch?v=12345678901
 * Share Url: https://youtu.be/12345678901
 * Share Url with start time: https://youtu.be/12345678901?t=6
 * Mobile browser url: https://m.youtube.com/watch?v=12345678901&list=RD12345678901&start_radio=1
 * Long url: https://www.youtube.com/watch?v=12345678901&list=RD12345678901&start_radio=1&rv=smKgVuS
 * Long url with start time: https://www.youtube.com/watch?v=12345678901&list=RD12345678901&start_radio=1&rv=12345678901&t=38
 * Youtube Shorts: https://youtube.com/shorts/12345678901
 *
 */
// eslint-disable-next-line no-useless-escape
const youtubeUrlRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=|shorts\/)([^#\&\?]*).*/
const youtubeVideoIdLength = 11

// eslint-disable-next-line no-useless-escape
const httpPrefixRegExp = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

const validateYoutubeUrl = (url: string): boolean => {
	const isHttpPrefixed = url.match(httpPrefixRegExp)

	if (!isHttpPrefixed) return false

	const match = url.match(youtubeUrlRegExp)

	return match ? match[2].length === youtubeVideoIdLength : false
}

type Props = {
	className?: string
	onAddClick: (data: { url: string; title: string; thumbnailUrl: string }) => void
}

const YoutubeUrlForm = ({ className, onAddClick }: Props): JSX.Element => {
	const [url, setUrl] = useState('')

	const isValidYoutubeUrl = validateYoutubeUrl(url)

	const { data, isFetching, isError, error } = useYoutubeMetadata(url, {
		enabled: isValidYoutubeUrl,
		useErrorBoundary: false,
		suspense: false
	})

	const errorMessage = useMemo(() => {
		if (url && !isValidYoutubeUrl) {
			return 'Please provide a valid Youtube URL'
		}

		if (error) {
			return (error as AxiosError<{ message: string }>)?.response?.data?.message
		}

		return ''
	}, [url, isValidYoutubeUrl, error])

	const handleAddVideo = (): void => {
		if (data) {
			onAddClick({
				url,
				title: data.title,
				thumbnailUrl: data.thumbnail_url
			})
		}

		setUrl('')
	}

	const onSubmit = (e: React.FormEvent): void => {
		e.preventDefault()
		handleAddVideo()
	}

	return (
		<form className={className} onSubmit={onSubmit}>
			<div className={clsx('text-subtitle2 font-medium text-grey-1100', 'mb-2', 'flex items-center gap-1')}>
				<YoutubeLogo/>
				Youtube URL
			</div>
			<div className={clsx('flex gap-2')}>
				<div className={clsx('relative', 'flex-1', 'w-[600px]')}>
					<Input
						className="h-9 w-full"
						value={url}
						onChange={(e): void => setUrl(e.target.value)}
						onClear={(): void => setUrl('')}
						error={Boolean(errorMessage)}
						helperText={errorMessage}
						placeholder="https://www.youtube.com/watch?v=484hydNEJC0"
						type="text"
					/>
					{isValidYoutubeUrl && !isError && (
						<div
							className={clsx(
								'absolute top-10 z-10',
								'shadow-[0_3px_8px_0px_#0000001A]',
								'bg-white',
								'h-[48px] w-full'
							)}
						>
							{isFetching && (
								<div className={clsx('flex items-center gap-2', 'h-full w-full', 'px-2')}>
									<Skeleton className="rounded-[4px]" variant="rectangular" width={56} height={32} />
									<Skeleton variant="text" width="80%" />
								</div>
							)}
							{data && (
								<button
									className={clsx(
										'px-2',
										'border-none',
										'flex items-center gap-2',
										'h-full w-full',
										'cursor-pointer',
										'bg-transparent',
										'hover:bg-grey-50',
										'active:bg-green-50'
									)}
									type="button"
									onClick={handleAddVideo}
								>
									<div className={clsx('h-[32px] w-[56px]', 'relative', 'bg-grey-100', 'rounded-[4px]')}>
										<Image
											className="rounded-[4px]"
											// src={data.thumbnail_url}
											// layout="fill"
											// alt="youtube thumbnail image"
											// objectFit="cover"
										/>
									</div>
									<span
										className={clsx(
											'flex-1',
											'text-left text-body2 font-normal text-grey-900',
											'line-clamp-1 md:line-clamp-2'
										)}
									>
										{data.title}
									</span>
								</button>
							)}
						</div>
					)}
				</div>
				<button
					className={clsx(
						'h-9',
						'px-3 py-2',
						'md:px-4',
						'text-subtitle3 text-black',
						'flex justify-center gap-1',
						'border-none',
						'bg-[#E5E6E4]',
						'hover:bg-grey-300',
						'cursor-pointer',
						'disabled:cursor-default',
						'disabled:text-grey-400',
						'disabled:bg-grey-100',
                        'flex',
                        'justify-center',
                        'items-center'
					)}
					disabled={!isValidYoutubeUrl || isFetching}
					type="submit"
				>
					<AddIcon fontSize="small" /> 
                    <p className={'font-aeonikBold text-sm text-[#222222]'}>Add</p>
				</button>
			</div>
		</form>
	)
}

export default YoutubeUrlForm
