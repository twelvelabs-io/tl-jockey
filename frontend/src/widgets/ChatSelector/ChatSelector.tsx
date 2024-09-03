/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react'
import answers from '../../info/answers.json'

import ChatMessagesList from '../../components/ChatMessagesList/ChatMessagesList'
import ChatForm from './ChatForm'
import { ActionType } from '../VideoAssistant/hooks/useChatTypes'
import StartNewGroup from '../VideoAssistant/StartNewGroup'

import { ChatSelectProps } from './ChatSelectorTypes';
import PanelWrapper from '../Panel/PanelWrapper'
import { useChat } from '../VideoAssistant/hooks/useChat'
import { ModalType } from '../../types/messageTypes'
import { ButtonTypes } from '../../types/buttonTypes'
import { ErrorBoundary } from 'react-error-boundary'
import helpersFunctions from '../../helpers/helpers'
import { streamEvents } from '../../apis/streamEventsApis'

interface ErrorFallbackProps {
  error: Error
}

const ErrorFallback:React.FC<ErrorFallbackProps> = ({ error }) => (
  <div>
    <p>Something went wrong: {error.message}</p>
  </div>
);

const ChatSelector: React.FC<ChatSelectProps> = ({ chatContainerRef, setAutofillApi, submitButtonRef, setChoosedElement, setCurrentVideoFile, setShowAutofillQuestions, showAutofillQuestions, videoRef }) => {
  const [state, dispatch] = useChat()
  const {selectedFile, inputBox, responseText, arrayMessages, loading, selectedFileData } = state
  const [streamData, setStreamData] = useState(['']);
  
  const handleChatApi = async () => {
    if (selectedFile !== null && selectedFile !== undefined) {
      dispatch({ type: ActionType.SET_LOADING, payload: true })
      dispatch({
        type: ActionType.REMOVE_INITIAL_MESSAGE,
        payload: undefined
      })
      dispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: inputBox })
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
            question: inputBox
          }
        ]
      })
      try {
        streamEvents(ActionType, dispatch, inputBox, setStreamData, arrayMessages)
        dispatch({ type: ActionType.SET_LOADING, payload: false })
      } catch (error) {
        dispatch({ type: ActionType.SET_LOADING, payload: false })
      }
    }
    dispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
  }

  const answersFull = answers[selectedFileData?.filename as unknown as keyof typeof answers]
  const autofillQuestions = answersFull !== undefined ? answersFull?.map((item) => item.question) : 
  answers["Rabbit.mp4" as unknown as keyof typeof answers].map((item) => item.question)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' && submitButtonRef.current !== null && submitButtonRef.current !== undefined) {
        submitButtonRef.current.click() 
      }
    }

    const inputElement = document.querySelector('input')
    if (inputElement !== null) {
      inputElement.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      if (inputElement !== null) {
        inputElement.removeEventListener('keydown', handleKeyPress)
      }
    }
  })

  useEffect(() => {
    dispatch({ type: ActionType.SET_SELECTED_FILE, payload: '' })
    setCurrentVideoFile('')
  }, [])

  useEffect(() => {
    if (autofillQuestions?.some((question) => question === responseText)) {
      setAutofillApi(true)
    } else {
      setAutofillApi(false)
    }
  }, [arrayMessages, autofillQuestions, responseText, setAutofillApi])

  const clearChat = (): void => {
    dispatch({
        type: ActionType.SET_MODAL_TYPE,
        payload: ModalType.CLEAR_CHAT,
    });
    dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
  }

  const isInitialMessage = arrayMessages[0]?.sender === 'initial'

  const handleShow = (index: number | undefined, indexOfElementInArray: number): void => {
    helpersFunctions.openMessagesModal(dispatch, indexOfElementInArray, index)
  }
  
  return (
    <div className='flex flex-row  border-[#E5E6E4]'>
       <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className=" bg-[#F9FAF9]  border-r-[#E5E6E4] flex flex-col justify-between h-full"><PanelWrapper/></div>
            <div className="w-full flex flex-col">
              <div className={'flex-col flex h-[100vh] lg:h-[70vh] md:h-[70vh] xl:h-[80vh] overflow-y-auto'} ref={chatContainerRef} >
                { !isInitialMessage && 
                  <StartNewGroup 
                    clearChat={clearChat} 
                    text={ButtonTypes.CLEAR} 
                    colorOfIcon='#929490' 
                    width={'11.67'} 
                    height={'15'}
                  />
                }
                <div className="w-full flex justify-center items-center">
                  <ChatMessagesList
                      arrayMessages={arrayMessages}
                      handleShow={handleShow}
                      videoRef={videoRef}
                      setChoosedElement={setChoosedElement}
                  />
                </div>
              </div>
              <div className={'w-full flex justify-center items-center'}>
                <ChatForm
                  setShowAutofillQuestions={setShowAutofillQuestions}
                  submitButtonRef={submitButtonRef}
                  autofillQuestions={autofillQuestions}
                  setAutofillApi={setAutofillApi}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  handleChatApi={handleChatApi}
                  showAutofillQuestions={showAutofillQuestions}
                />
              </div>
            </div>
          </ErrorBoundary>
        </div>
  )
}

export default ChatSelector

