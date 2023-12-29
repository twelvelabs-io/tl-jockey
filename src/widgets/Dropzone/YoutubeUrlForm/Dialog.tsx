import type { ButtonProps } from '@mui/material/Button'
import type { DialogProps as MUIDialogProps } from '@mui/material/Dialog'
import type { TypographyProps } from '@mui/material/Typography'
import type { FormEventHandler } from 'react'

import Button from '@mui/material/Button'
import MUIDialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import capitalize from 'lodash/capitalize'
import React, { useMemo } from 'react'

const DialogTitle = styled((props: TypographyProps) => <Typography {...props} />)(
	({ theme: { spacing } }) => ({
		padding: spacing(24),
		letterSpacing: 0
	})
)

const CancelButton = styled((props: ButtonProps) => <Button variant="text" color="inherit" {...props} />)(
	({ theme }) => ({
		color: theme.palette.grey[700]
	})
)

export interface DialogProps extends Omit<MUIDialogProps, 'title' | 'onSubmit'> {
	title?: JSX.Element | string
	closeText?: string
	/**
	 * Because MUIDialog uses React.Portal, we need to handle form internally
	 */
	onSubmit?: FormEventHandler<HTMLFormElement>
	action: {
		label: string
		loading?: boolean
	} & Pick<ButtonProps, 'aria-label' | 'disabled' | 'onClick' | 'color' | 'startIcon'>
}

const Dialog = ({
	onClose,
	onSubmit,
	title,
	closeText = 'Cancel',
	children,
	action: { label: actionLabel, ...actionProps },
	...props
}: DialogProps): JSX.Element => {
	const dialogContent = useMemo(
		() => (
			<>
				<DialogTitle {...(React.isValidElement(title) && { component: 'div' })}>{title}</DialogTitle>
				<DialogContent>{children}</DialogContent>
				<DialogActions>
					{onClose && (
						<CancelButton sx={{ mr: 'auto' }} onClick={(): void => onClose({ name: 'CancelButton' }, 'backdropClick')}>
							{closeText}
						</CancelButton>
					)}
				</DialogActions>
			</>
		),
		[actionLabel, actionProps, children, closeText, onClose, onSubmit, title]
	)

	return (
		<MUIDialog onClose={onClose} {...props}>
			{onSubmit ? <form onSubmit={onSubmit}>{dialogContent}</form> : dialogContent}
		</MUIDialog>
	)
}

export default Dialog // TODO: Export this to @twelvelabs/ui package
