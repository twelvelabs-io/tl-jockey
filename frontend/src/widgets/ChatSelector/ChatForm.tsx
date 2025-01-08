import React, {useEffect, useRef} from 'react'
import Input from '../../components/Input/Input'
import SubmitButton from '../../components/SubmitButton/SubmitButton'
import useMatch from './hooks/useMatch'
import answers from '../../info/answers.json'
import {ActionType} from '../VideoAssistant/hooks/useChatTypes'
import {ChatFormProps} from './ChatFormTypes'
import {useChat} from '../VideoAssistant/hooks/useChat'
import Loading from '../../components/Loading/Loading'

const ChatForm: React.FC<ChatFormProps> = ({
	submitButtonRef,
	autofillQuestions,
	setAutofillApi,
	handleChatApi,
	showAutofillQuestions,
	setShowAutofillQuestions,
	inputBoxStyle,
}) => {
	const [state, dispatch] = useChat()
	const {inputBox, responseText, selectedFile, loading} = state
	const handleInputChange = (event: {target: {value: React.SetStateAction<string>}}): void => {
		dispatch({type: ActionType.SET_INPUT_BOX, payload: event.target.value as string})
		setShowAutofillQuestions(false)
	}
	const {link, linkText, arsTextCheck, lameTextCheck, staticAnswer, staticAnswerTwelve, matchingAnswer} = useMatch(answers, selectedFile, inputBox)

	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()

		const handleDocumentClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement

			if (
				window.getSelection()?.toString() ||
				target.matches('button, a, [role="button"], select, textarea, input') ||
				target.closest('.aiBubble, .chatMessage, .modal')
			) {
				return
			}

			// Only refocus when clicking empty areas
			if (target.matches('body, #root, .chat-container')) {
				inputRef.current?.focus()
			}
		}

		document.addEventListener('click', handleDocumentClick)
		return () => {
			document.removeEventListener('click', handleDocumentClick)
		}
	}, [!loading])

	const handleChat = async (): Promise<void> => {
		if (selectedFile !== null && selectedFile !== undefined) {
			dispatch({type: ActionType.SET_LINK_URL, payload: link})
			// dispatch({ type: ActionType.SET_LOADING, payload: true })
			try {
				dispatch({
					type: ActionType.SET_ARRAY_MESSAGES,
					payload: [
						{
							sender: 'user',
							text: inputBox,
							link: '',
							linkText: '',
							twelveText: '',
							asrTest: '',
							lameText: '',
							question: inputBox,
						},
					],
				})
				const randomDelay = Math.random() * (5000 - 1000) + 5000 // Random time between 1000ms and 2500ms (1 to 2.5 seconds)
				setTimeout(() => {
					dispatch({
						type: ActionType.SET_ARRAY_MESSAGES,
						payload: [
							{
								sender: 'ai',
								text: staticAnswer,
								link: matchingAnswer !== null && matchingAnswer !== undefined ? link : '',
								linkText: matchingAnswer !== null && matchingAnswer !== undefined ? linkText : '',
								twelveText: staticAnswerTwelve,
								asrTest: arsTextCheck,
								lameText: lameTextCheck,
								question: inputBox,
							},
						],
					})
				}, randomDelay)
			} catch (error) {
				console.error('Error sending chat request:', error)
			}
		}
		dispatch({type: ActionType.SET_INPUT_BOX, payload: ''})
	}

	const handleInputClick = (): void => {
		setShowAutofillQuestions(true)
	}
	const placeholderText = inputBoxStyle === 'red' ? 'Provide feedback for Jockey' : 'Type here'
	return (
		<div className={'flex flex-row w-[240px] sm:w-[440px] md:w-[680px] lg:w-[680px] absolute bottom-[48px]'}>
			<Input
				ref={inputRef}
				disabled={loading}
				onChange={handleInputChange}
				placeholder={placeholderText}
				onClick={handleInputClick}
				value={inputBox}
				className={`w-full shadow-sm rounded h-[44px] border-1 border-solid pl-3 pr-3 pt-2 pb-2 text-[16px] font-aeonik focus:border-[#9AED59] focus:outline-none border-[${inputBoxStyle}]`}
			/>
			{/* hh-88px */}
			{/* <div className="flex flex-row items-end justify-end pb-4"> */}
			<SubmitButton
				value={inputBox}
				submitButtonRef={submitButtonRef}
				autofillQuestions={autofillQuestions}
				responseText={responseText}
				setAutofillApi={setAutofillApi}
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				handleChat={handleChat}
				handleChatApi={handleChatApi}
			/>
			{/* </div> */}
		</div>
	)
}

export default ChatForm
