/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect } from 'react'
import axios from 'axios'
import answers from '../../info/answers.json'

import Loading from '../../components/Loading/Loading'
import AutofillQuestions from '../../components/AutofillQuestions/AutofillQuestions'
import ChatMessagesList from '../../components/ChatMessagesList/ChatMessagesList'
import ChatForm from './ChatForm'
import { ActionType, type State } from '../VideoAssistant/hooks/useChat'
import StartNewGroup from '../VideoAssistant/StartNewGroup'

export enum DefaultVideo {
  FILE_NAME = '#4 Cooper Kupp (WR, Rams) | Top 100 Players in 2022.mp4',
  FILE_PATH = 'https://firebasestorage.googleapis.com/v0/b/shark-4be33.appspot.com/o/%234%20Cooper%20Kupp%20(WR%2C%20Rams)%20%7C%20Top%20100%20Players%20in%202022.mp4?alt=media&token=53e18668-b339-4ba2-b7fc-f88fa2e033da'
}
const apiKey = process.env.REACT_APP_API_MAIN_KEY
const ServerForGeneralChat = 'https://15e6-2600-8802-3911-f100-e934-c048-c6a9-2619.ngrok-free.app/worker_generate_stream3'
const ServerForASRRequests = 'https://15e6-2600-8802-3911-f100-e934-c048-c6a9-2619.ngrok-free.app/asr'

export interface ChatSelectProps {
  chatState: State
  chatDispatch: React.Dispatch<any>
  showAutofillQuestions: boolean
  setCurrentVideoFile: (file: string) => void
  setShowAutofillQuestions: (show: boolean) => void
  setAutofillApi: (file: boolean) => void
  setChoosedElement: (file: number | undefined) => void
  submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  chatContainerRef: React.RefObject<HTMLDivElement>
  videoRef: React.RefObject<HTMLVideoElement>
  videoFiles: string[]
  currentVideoFile: string
}


export enum FallBackVideoID {
  ID = '65b9b9a74c7620f1c80955b1'
}


const ChatSelector: React.FC<ChatSelectProps> = ({ chatState, chatDispatch, chatContainerRef, setAutofillApi, submitButtonRef, setChoosedElement, setCurrentVideoFile, setShowAutofillQuestions, showAutofillQuestions, videoRef }) => {
  const { selectedFile, inputBox, responseText, arrayMessages, loading, selectedFileData } = chatState
  console.log(selectedFileData)
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
        api_key: apiKey,
        prompt: inputBox,
        agent_history: null,
        description: "",
        stream: false
      }

      try {
        const response = await axios.post(
          ServerForGeneralChat,
          { options: options }
        )

        const responseData2 = await axios.post(
          ServerForASRRequests,
          requestData
        )

        let jsonObject2 = JSON.stringify(responseData2.data)
        jsonObject2 = JSON.parse(jsonObject2)

        const startIndex2 = jsonObject2.indexOf('text')
        const endIndex2 = jsonObject2.indexOf('error_code')
        const extractedText2 = jsonObject2.slice(startIndex2 + 8, endIndex2 - 4).trim()
        console.log(extractedText2)
        
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
        console.error('Request error:', error)
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
        // Check if the Enter key is pressed and the submit button exists
        submitButtonRef.current.click() // Trigger a click event on the submit button
      }
    }

    const inputElement = document.querySelector('input')
    if (inputElement !== null) {
      inputElement.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      // Cleanup the event listener when the component unmounts
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
          <div className={'pl-[10vw] pr-[10vw] pt-6 flex-col border-l border-gray-300 flex h-[80vh]'} ref={chatContainerRef} >
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

