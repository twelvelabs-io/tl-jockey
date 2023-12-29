/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import CloseIcon from '@mui/icons-material/Close'
import { clsx } from 'clsx'
import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	helperText?: string
	error?: boolean
	onClear?: () => void
}

const InputDropZone = ({ className, error, helperText, onClear, value, ...props }: InputProps): JSX.Element => (
	<div className="flex flex-col">
		<div className="relative">
			<input
				{...props}
				className={clsx(
					className,
					'text-body2',
					'py-1 pl-2 pr-8',
					'border border-solid border-grey-400',
					'hover:bg-grey-100',
					'focus:border-green-500',
					'focus:bg-transparent',
					'placeholder:text-grey-500',
					error && '!border-red-500'
				)}
				value={value}
			/>
			{Boolean(onClear) && Boolean(value) && (
				<button
					className={clsx(
						'p-0',
						'absolute right-2 top-1/2 -translate-y-1/2',
						'border-none',
						'bg-transparent',
						'cursor-pointer'
					)}
					type="button"
					onClick={onClear}
				>
					<CloseIcon className="text-grey-500" fontSize="small" />
				</button>
			)}
		</div>
		{helperText && <div className={clsx('text-body3', 'mt-1', error && 'text-red-500')}>{helperText}</div>}
	</div>
)

export default InputDropZone
