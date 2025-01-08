import React from 'react'
import {motion} from 'framer-motion'
import {ReactComponent as MarengoIcon} from '../../icons/marengo.svg'
import {itemVariants} from './animationVariants'
import {thinkingComponentTexts} from './thinkingComponentConfig'

interface SearchingThinkingNodeProps {
	searchTerm: string
}

const SearchingThinkingNode: React.FC<SearchingThinkingNodeProps> = ({searchTerm}) => {
	return (
		<motion.div className="flex items-center gap-2" variants={itemVariants} initial="hidden" animate="visible">
			<motion.span variants={itemVariants}>{thinkingComponentTexts.searchingWith(searchTerm)}</motion.span>
			<motion.div variants={itemVariants} initial="hidden" animate="visible">
				<MarengoIcon className="w-[96px] h-[24px] cursor-pointer" />
			</motion.div>
		</motion.div>
	)
}

export default SearchingThinkingNode
