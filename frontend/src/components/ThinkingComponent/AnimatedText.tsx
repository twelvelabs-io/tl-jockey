import React from 'react'
import {motion} from 'framer-motion'
import {itemVariants} from './animationVariants'

interface AnimatedTextProps {
	text: string
}

const AnimatedText: React.FC<AnimatedTextProps> = ({text}) => {
	const words = text.split(' ')
	return (
		<motion.div className="flex items-center" variants={itemVariants}>
			<div className="flex gap-[0.25em]">
				{words.map((word, wordIndex) => (
					<div key={wordIndex} className="flex">
						{word.split('').map((char, charIndex) => (
							<span key={`${wordIndex}-${charIndex}`} style={{color: '#4B5563'}}>
								{char}
							</span>
						))}
					</div>
				))}
			</div>
			<span className="ml-[2px]">...</span>
		</motion.div>
	)
}

export default AnimatedText
