import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

type Props = {
	className?: string
	children: React.ReactNode
	open: boolean
}

const Collapse = ({ open, className, children }: Props): JSX.Element => (
	<AnimatePresence initial={false}>
		{open && (
			<motion.div
				className={clsx(className, 'overflow-hidden')}
				initial="collapsed"
				animate="open"
				exit="collapsed"
				variants={{
					open: { opacity: 1, height: 'auto' },
					collapsed: { opacity: 0, height: 0 }
				}}
				transition={{ duration: 0.2, ease: 'easeOut' }}
			>
				{children}
			</motion.div>
		)}
	</AnimatePresence>
)

export default Collapse
