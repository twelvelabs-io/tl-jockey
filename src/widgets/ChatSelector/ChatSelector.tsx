/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect } from 'react'
import axios from 'axios'
import answers from '../../info/answers.json'

import Loading from '../../components/Loading/Loading'
import AutofillQuestions from '../../components/AutofillQuestions/AutofillQuestions'
import ChatMessagesList from '../../components/ChatMessagesList/ChatMessagesList'
import ChatForm from './ChatForm'
import { ActionType } from '../VideoAssistant/hooks/useChatTypes'
import StartNewGroup from '../VideoAssistant/StartNewGroup'

import { ChatSelectProps, DefaultVideo, FallBackVideoID } from './ChatSelectorTypes';
import { ServerConfig } from '../../server/serverConfig'
import API_KEYS from '../../apis/apiKeys'

const ChatSelector: React.FC<ChatSelectProps> = ({ chatState, chatDispatch, chatContainerRef, setAutofillApi, submitButtonRef, setChoosedElement, setCurrentVideoFile, setShowAutofillQuestions, showAutofillQuestions, videoRef }) => {
  const { selectedFile, inputBox, responseText, arrayMessages, loading, selectedFileData } = chatState
  const handleChatApi = async () => {
    if (selectedFile !== null && selectedFile !== undefined) {

      chatDispatch({ type: ActionType.SET_LOADING, payload: true })

      chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: inputBox })
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

      const requestData = {
        videos: '',
        prompt: inputBox,
        agent_history: null,
        duration: 60.0,
        asr: '',
        description: ''
      }


      const options = {
        video_id: selectedFileData ? selectedFileData?.id : FallBackVideoID.ID,
        api_key: API_KEYS.MAIN,
        prompt: inputBox,
        agent_history: null,
        description: "",
        stream: false
      }

      try {
        const response = await axios.post(
          ServerConfig.ServerForGeneralChat,
          { options: options }
        )

        const responseData2 = await axios.post(
          ServerConfig.ServerForASRRequests,
          requestData
        )

        let jsonObject2 = JSON.stringify(responseData2.data)
        jsonObject2 = JSON.parse(jsonObject2)

        const startIndex2 = jsonObject2.indexOf('text')
        const endIndex2 = jsonObject2.indexOf('error_code')
        const extractedText2 = jsonObject2.slice(startIndex2 + 8, endIndex2 - 4).trim()
        
        let jsonObject = JSON.stringify(response.data)
        jsonObject = JSON.parse(jsonObject)
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })

        const startIndex = jsonObject.indexOf('text')
        const endIndex = jsonObject.indexOf('error_code')
        const extractedText = jsonObject.slice(startIndex + 8, endIndex - 4).trim()
        
        chatDispatch({
          type: ActionType.SET_ARRAY_MESSAGES,
          payload: [
            {
              sender: 'ai',
              text: extractedText,
              link: '',
              linkText: '',
              twelveText: extractedText,
              asrTest: extractedText2,
              lameText: '',
              question: inputBox
            }
          ]
        })
      } catch (error) {
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })
      }
    }
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
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
    chatDispatch({ type: ActionType.SET_SELECTED_FILE, payload: DefaultVideo.FILE_NAME })
    setCurrentVideoFile(DefaultVideo.FILE_PATH)
  }, [])

  useEffect(() => {
    if (autofillQuestions?.some((question) => question === responseText)) {
      setAutofillApi(true)
    } else {
      setAutofillApi(false)
    }
  }, [arrayMessages, autofillQuestions, responseText, setAutofillApi])

  const clearChat = (): void => {
    chatDispatch({ type: ActionType.SET_LOADING, payload: false })
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
    chatDispatch({
      type: ActionType.SET_ARRAY_MESSAGES_CLEAN,
      payload: []
    })
  }

  return (
    <div>
          <div className={'pl-[10vw] pr-[10vw] pt-6 flex-col border-l border-gray-300 flex h-[70vh] lg:h-[70vh] md:h-[70vh] xl:h-[80vh]'} ref={chatContainerRef} >
            <ChatMessagesList
                chatState={chatState}
                chatDispatch={chatDispatch}
                videoRef={videoRef}
                setChoosedElement={setChoosedElement}
            />
            <div className={`justify-end flex items-end flex-col flex-1 ${showAutofillQuestions ? 'gap-3' : 'gap-6'}`}>
              {loading ? <Loading/> : '' }
            </div>
            {showAutofillQuestions &&
              <div className='relative'>
                <div className="sticky">
                    <AutofillQuestions
                        chatDispatch={chatDispatch}
                        autofillQuestions={autofillQuestions}
                        setShowAutofillQuestions={setShowAutofillQuestions}
                    />
                </div>
              </div>
              }
            {!loading ? <StartNewGroup clearChat={clearChat}/> : ''}
          </div>
          <div className={'pl-[10vw] pr-[10vw] '}>
            <ChatForm
              chatState={chatState}
              chatDispatch={chatDispatch}
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
  )
}

export default ChatSelector

