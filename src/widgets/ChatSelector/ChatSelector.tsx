/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import answers from '../../info/answers.json'

import Loading from '../../components/Loading/Loading'
import AutofillQuestions from '../../components/AutofillQuestions/AutofillQuestions'
import ChatMessagesList from '../../components/ChatMessagesList/ChatMessagesList'
import ChatForm from './ChatForm'
import { ActionType } from '../VideoAssistant/hooks/useChatTypes'
import StartNewGroup from '../VideoAssistant/StartNewGroup'

import { ChatSelectProps, DefaultVideo } from './ChatSelectorTypes';
import { chunk } from 'lodash'
import PanelWrapper from '../Panel/PanelWrapper'
import { useChat } from '../VideoAssistant/hooks/useChat'
import { ModalType } from '../../types/messageTypes'
import { ButtonTypes } from '../../types/buttonTypes'

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

      const includeTypes = ["chat_model"];
      const includeNames = ["AzureChatOpenAI", "video-search", "download-video", "combine-clips", "remove-segment"];
  
      const requestBody = {
          input: "Use index id 659f2e829aba4f0b402f6488 to find the top clip of a touchdown",
          configurable: { session_id: Date.now() },
          version: "v1",
          include_types: includeTypes,
          include_names: includeNames,
      };

      try {
        const requestData = {
          input: `Use index id 659f2e829aba4f0b402f6488 ${inputBox}`,
          tool_descriptions: {
            "video-search": " Run a search query against a collection of videos and get results.",
            "download-video": " Download a video for a given video in a given index and get the filepath. \n    Should only be used when the user explicitly requests video editing functionalities.",
            "combine-clips": "search tool. The full filepath for the combined clips is returned.",
            "remove-segment": " Remove a segment from a video at specified start and end times The full filepath for the edited video is returned."
          },
          configurable: { session_id: Date.now() },
          version: "v1",
          include_types: includeTypes,
          include_names: includeNames,
        };
        fetch('http://0.0.0.0:8080/stream_events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestData),
})
.then(async response => {
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  console.log(response)
  dispatch({
    type: ActionType.SET_ARRAY_MESSAGES,
    payload: [
      {
        sender: 'ai',
        text: '',
        link: '',
        linkText: '',
        twelveText: '',
        asrTest: '',
        lameText: '',
        question: ''
      }
    ]
  })
  let jsonData = ''; 
  const responseBody = response.body;
  if (!responseBody) {
    throw new Error('Response body is null or undefined');
  }
  dispatch({ type: ActionType.SET_LOADING, payload: true })
  const reader = responseBody.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let accumulatedContent = '';

  
  async function processChunk(chunkValue: string) {
    if (!chunkValue.startsWith('Running =>')) {
      accumulatedContent += chunkValue
    }
    console.log(accumulatedContent)
    const jsonStartIndex =accumulatedContent.indexOf('[');
    const jsonEndIndex = accumulatedContent.lastIndexOf(']');
    let accumulatedContentWithoutJSON = accumulatedContent.replace(/\[.*\]/s, '')
    if (chunkValue.startsWith('Running =>')) {
      dispatch({
        type: ActionType.SET_STATUS_MESSAGES,
        payload: [chunkValue],
      });
    }
    dispatch({
      type: ActionType.CHANGE_ARRAY_MESSAGE,
      payload: [
        {
          sender: 'ai',
          text: accumulatedContentWithoutJSON,
          link: '',
          linkText: '',
          twelveText: accumulatedContentWithoutJSON,
          asrTest: '',
          lameText: '',
          question: inputBox
        }
      ]
    });
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonStartIndex < jsonEndIndex) {
      const jsonChunk = accumulatedContent.substring(jsonStartIndex, jsonEndIndex + 1);
      try {
        setStreamData(prevData => [...prevData, chunkValue]);
        jsonData = JSON.parse(jsonChunk);
        console.log(arrayMessages)
        console.log('Parsed JSON data:', jsonData);
        dispatch({
          type: ActionType.ADD_TOOLS_DATA_TO_LAST_ELEMENT,
          payload: jsonData
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    } 
    console.log("Received chunk:", chunkValue);
    console.log("Accumulated content:", accumulatedContent);
    // await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (done) {
      break; // Exit the loop if done reading
    }
    done = doneReading;
      const chunkValue = decoder.decode(value, { stream: true });
      await processChunk(chunkValue)
      // if (chunkValue === '```' || chunkValue === '`' || chunkValue === '``' || chunkValue === '```') {
      //   stopUpdatingMessage = true
      // }
      // const SchemaVideoFiles = JSON.parse(streamData[0])
      // const hasVideoUrl = SchemaVideoFiles.some((item: { video_url: any }) => item.video_url);
      
      // if (hasVideoUrl) {
      //   streamData.shift()
      // }

      console.log("Received chunk:", chunkValue);
      console.log("Accumulated content:", accumulatedContent);
  }
  dispatch({ type: ActionType.SET_LOADING, payload: false })
  console.log("Streaming complete. Final content:", accumulatedContent);
  dispatch({
    type: ActionType.CLEAR_STATUS_MESSAGES,
    payload: [],
  });
  dispatch({ type: ActionType.SET_LOADING, payload: false })
  return accumulatedContent
})
.catch(error => {
  console.error('Error:', error);
});
        
        let jsonObject = JSON.stringify(Response)
        jsonObject = JSON.parse(jsonObject)
        dispatch({ type: ActionType.SET_LOADING, payload: false })

        const startIndex = jsonObject.indexOf('text')
        const endIndex = jsonObject.indexOf('error_code')
        const extractedText = jsonObject.slice(startIndex + 8, endIndex - 4).trim()
        console.log('here')
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
    dispatch({ type: ActionType.SET_SELECTED_FILE, payload: DefaultVideo.FILE_NAME })
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
    dispatch({
        type: ActionType.SET_MODAL_TYPE,
        payload: ModalType.CLEAR_CHAT,
    });
    dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
  }
  console.log(arrayMessages)

  const isInitialMessage = arrayMessages[0].sender === 'initial'

  return (
    <div className='flex flex-row  border-[#E5E6E4]'>
          <div className=" bg-[#F9FAF9]  h-[100vh] border-r-[#E5E6E4]"><PanelWrapper/></div>
          <div className=" w-full">
            <div className={'pl-[10vw] pr-[10vw] pt-6 flex-col  flex h-[70vh] lg:h-[70vh] md:h-[70vh] xl:h-[80vh]'} ref={chatContainerRef} >
              { !isInitialMessage && 
                <StartNewGroup 
                  clearChat={clearChat} 
                  text={ButtonTypes.CLEAR} 
                  colorOfIcon='#929490' 
                  width={'11.67'} 
                  height={'15'}
                />
              }
              <ChatMessagesList
                  videoRef={videoRef}
                  setChoosedElement={setChoosedElement}
              />
            </div>
            <div className={'pl-[10vw] pr-[10vw] '}>
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
        </div>
  )
}

export default ChatSelector

