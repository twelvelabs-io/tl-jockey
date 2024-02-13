import React from 'react'
import Input from '../../components/Input/Input'
import SubmitButton from '../../components/SubmitButton/SubmitButton'
import useMatch from './hooks/useMatch'
import answers from '../../info/answers.json'
import { ActionType, type State } from '../VideoAssistant/hooks/useChat'

interface ChatFormProps {
  chatState: State
  chatDispatch: React.Dispatch<any>
  submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  autofillQuestions: string[]
  setAutofillApi: (file: boolean) => void
  handleChatApi: () => void
  showAutofillQuestions: boolean
  setShowAutofillQuestions: (show: boolean) => void
}

const ChatForm: React.FC<ChatFormProps> = ({
  chatState,
  chatDispatch,
  submitButtonRef,
  autofillQuestions,
  setAutofillApi,
  handleChatApi,
  showAutofillQuestions,
  setShowAutofillQuestions
}) => {
  const { inputBox, responseText, selectedFile, arrayMessages } = chatState
  const handleInputChange = (event: { target: { value: React.SetStateAction<string> } }): void => {
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: event.target.value as string })
    setShowAutofillQuestions(false)
  }
  const {
    link,
    linkText,
    arsTextCheck,
    lameTextCheck,
    staticAnswer,
    staticAnswerTwelve,
    matchingAnswer
  } = useMatch(answers, selectedFile, inputBox)

  const handleChat = async (): Promise<void> => {
    if (selectedFile !== null && selectedFile !== undefined) {
      chatDispatch({ type: ActionType.SET_LINK_URL, payload: link })
      chatDispatch({ type: ActionType.SET_LOADING, payload: true })
      try {
        chatDispatch({
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
              question: inputBox
            }
          ]
        })
        const randomDelay = Math.random() * (5000 - 1000) + 5000 // Random time between 1000ms and 2500ms (1 to 2.5 seconds)
        setTimeout(() => {
          chatDispatch({
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
                question: inputBox
              }
            ]
          })
          chatDispatch({ type: ActionType.SET_LOADING, payload: false })
        }, randomDelay)
      } catch (error) {
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })
        console.error('Error sending chat request:', error)
      }
    }
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
  }

  const handleInputClick = (): void => {
    setShowAutofillQuestions(true)
  }

  console.log(arrayMessages)
  return (
    <div className={`flex flex-row justify-between gap-2 w-full border-l border-[#E5E6E4] border-solid pl-[70px] pr-[70px] ${showAutofillQuestions ? 'mt-0' : 'pt-3'}`}>
      <Input
        disabled={selectedFile === undefined}
        onChange={handleInputChange}
        placeholder='Start typing'
        onClick={handleInputClick}
        value={inputBox}
        className={'w-full shadow-sm h-12 border border-solid border-[#D4D5D2] pl-2 text-[16px] font-aeonik'}
      />
      <SubmitButton
        submitButtonRef={submitButtonRef}
        autofillQuestions={autofillQuestions}
        responseText={responseText}
        setAutofillApi={setAutofillApi}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        handleChat={handleChat}
        handleChatApi={handleChatApi}
      />
    </div>
  )
}

export default ChatForm
