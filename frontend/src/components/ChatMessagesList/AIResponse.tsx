import React, {useState} from 'react'
import {ReactComponent as AIIcon} from '../../icons/ai.svg'
import {ModalType, QuestionMessage} from '../../types/messageTypes'
import {ActionType, useChat} from '../../widgets/VideoAssistant/hooks/useChat'
import {AIResponseVideoSearch} from '../AIResponse/AIResponseVideoSearch'
import AIResponseHeader from '../AIResponse/AIResponseHeader'
import SkeletonChatVideoCard from '../../skeletons/SkeletonChatVideoCard'
import ExtendMessage from './helpers/ExtendMessage'
import helpersFunctions from '../../helpers/helpers'
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

interface AIResponseProps {
	message: QuestionMessage
	handleShow: (index: number | undefined, indexOfElementInArray: number) => void
}

const AIResponse: React.FC<AIResponseProps> = ({message, handleShow}) => {
	const hasTextMessage = message && message.text
	const hasValidMessage = message && message.text && message.linkText
	const [state, dispatch] = useChat()
	const [showAllVideos, setShowAllVideos] = useState(false)

	const {arrayMessages} = state

	const handleVideoClick = (index: number | undefined) => {
		const indexOfMessage = arrayMessages.findIndex((msg) => msg === message)
		dispatch({
			type: ActionType.SET_MODAL_TYPE,
			payload: ModalType.MESSAGES,
		})
		handleShow(index, indexOfMessage)
	}

	const urlsFromMessageText = (message?.toolsData as QuestionMessage['toolsData']) || []
	const videosLengthMoreThan3 = urlsFromMessageText.length !== 0 && urlsFromMessageText.length > 3

	return (
		<>
			<div className={'relative w-[680px] mb-[20px]'}>
				{hasTextMessage && <AIResponseHeader message={message} />}
				<div className={'aiBubble ml-[40px]  whitespace-pre-line gap-4'}>
					<div>
						{message ? (
							<AIResponseVideoSearch
								urlsFromMessageText={urlsFromMessageText}
								videosLengthMoreThan3={videosLengthMoreThan3}
								message={message}
								handleVideoClick={handleVideoClick}
								showAllVideos={showAllVideos}
								setShowAllVideos={setShowAllVideos}
							/>
						) : (
							<SkeletonChatVideoCard />
						)}
					</div>
					<div className="mt-[12px]">
						{/* { hasValidMessage ? (
                  <ExtendMessage agent={message.linkText} message={message.text}/>
              ) : <ExtendMessage agent='error' message={message.text}/>} */}
					</div>
				</div>
			</div>
		</>
	)
}

export default AIResponse
