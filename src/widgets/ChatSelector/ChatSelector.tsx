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

const ChatSelector: React.FC<ChatSelectProps> = ({ chatState, chatDispatch, chatContainerRef, setAutofillApi, submitButtonRef, setChoosedElement, setCurrentVideoFile, setShowAutofillQuestions, showAutofillQuestions, videoRef }) => {
  const { selectedFile, inputBox, responseText, arrayMessages, loading, selectedFileData } = chatState
  const [streamData, setStreamData] = useState(['']);
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
  chatDispatch({
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
  chatDispatch({ type: ActionType.SET_LOADING, payload: true })
  const reader = responseBody.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let accumulatedContent = '';
  
  async function processChunk(chunkValue: string) {
    if (!chunkValue.startsWith('Running =>')) {
      accumulatedContent += chunkValue
    }
    const jsonStartIndex =accumulatedContent.indexOf('[');
    const jsonEndIndex = accumulatedContent.lastIndexOf(']');
    let accumulatedContentWithoutJSON = accumulatedContent.replace(/\[.*\]/s, '')
    if (chunkValue.startsWith('Running =>')) {
      chatDispatch({
        type: ActionType.SET_STATUS_MESSAGES,
        payload: [chunkValue],
      });
    }
    chatDispatch({
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
        chatDispatch({
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
  chatDispatch({ type: ActionType.SET_LOADING, payload: false })
  console.log("Streaming complete. Final content:", accumulatedContent);
  chatDispatch({
    type: ActionType.CLEAR_STATUS_MESSAGES,
    payload: [],
  });
  chatDispatch({ type: ActionType.SET_LOADING, payload: false })
  return accumulatedContent
})
.catch(error => {
  console.error('Error:', error);
});


        // const responseData2 = await axios.post(
        //   ServerConfig.ServerForASRRequests,
        //   requestData
        // )

        //rewrite this part when API is ready 

        // let jsonObject2 = JSON.stringify(responseData2.data)
        // jsonObject2 = JSON.parse(jsonObject2)

        // const startIndex2 = jsonObject2.indexOf('text')
        // const endIndex2 = jsonObject2.indexOf('error_code')
        // const extractedText2 = jsonObject2.slice(startIndex2 + 8, endIndex2 - 4).trim()
        
        let jsonObject = JSON.stringify(Response)
        jsonObject = JSON.parse(jsonObject)
        chatDispatch({ type: ActionType.SET_LOADING, payload: false })

        const startIndex = jsonObject.indexOf('text')
        const endIndex = jsonObject.indexOf('error_code')
        const extractedText = jsonObject.slice(startIndex + 8, endIndex - 4).trim()
        console.log('here')
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
  console.log(arrayMessages)

  return (
    <div>
          <div className={'pl-[10vw] pr-[10vw] pt-6 flex-col border-l border-gray-300 flex h-[70vh] lg:h-[70vh] md:h-[70vh] xl:h-[80vh]'} ref={chatContainerRef} >
            <StartNewGroup clearChat={clearChat}/>
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
                <div className="sticky ml-7">
                    <AutofillQuestions
                        chatDispatch={chatDispatch}
                        autofillQuestions={autofillQuestions}
                        setShowAutofillQuestions={setShowAutofillQuestions}
                    />
                </div>
              </div>
              }
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

