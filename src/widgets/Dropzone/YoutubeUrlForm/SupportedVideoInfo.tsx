

import Skeleton from '@mui/material/Skeleton'
import clsx from 'clsx'
import Collapse from './Collapse'
import Suspense from './Suspense'
import { Fragment, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import React from 'react'

interface SupportedVideoInfoProps {
	indexId?: string
	className?: string
}

const SupportedVideoInfoList = ({
	indexId,
	open
}: Omit<SupportedVideoInfoProps, 'className'> & { open: boolean }): JSX.Element => {

	const fileLimits = useMemo(
		() => [
			['Resolution', '360p - 4k'],
			['Duration', '4s-2hrs'],
			['File size', '≤2GB per video'],
			['Audio', 'Required for conversation index option']
		],
		[]
	)

	return (
		<Collapse open={open}>
            <div className={clsx('grid grid-cols-[78px_1fr] gap-y-1 gap-x-4', 'md:grid-cols-[80px_1fr_80px_1fr]', 'mt-2')}>
			{fileLimits.map(([label, value]) => (
				<Fragment key={label}>
					<div className={'mr-3 text-subtitle3 font-medium text-black md:text-gray-900'}>{label}</div>
					<div className="text-body2 text-[#6F706D]">{value}</div>
				</Fragment>
			))}
            </div>
		</Collapse>
	)
}

const SupportedVideoInfoWithAction = ({ className, ...props }: SupportedVideoInfoProps): JSX.Element => {
	// const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('mobile'))
    const isMobile = false
	const [open, setOpen] = useState(true)

	const toggleCollapse = (): void => {
		if (!isMobile) return

		setOpen((prev) => !prev)
	}

	return (
		<div className={className}>
			<button
				className={clsx(
					'w-full',
					'text-subtitle2 font-medium text-gray-900',
					'bg-transparent',
					'border-none',
					'p-0',
					'flex items-center justify-between'
				)}
				type="button"
				onClick={toggleCollapse}
			>
				Supported videos
				{/* {isMobile && (
					<ChevronUpMini
						sx={{
							transform: open ? undefined : 'rotate(180deg)'
						}}
					/>
				)} */}
			</button>
			<Suspense
				fallback={
					<div className={clsx('grid grid-cols-[78px_1fr] gap-y-1', 'md:grid-cols-[80px_1fr_80px_1fr]', 'mt-2')}>
						{Array.from(Array(4).keys()).map((i) => (
							<Skeleton key={i} variant="rounded" className={clsx('w-40', 'h-5')} />
						))}
					</div>
				}
			>
				<ErrorBoundary fallback={<div />}>
					<SupportedVideoInfoList open={open} {...props} />
				</ErrorBoundary>
			</Suspense>
		</div>
	)
}

export default SupportedVideoInfoWithAction
