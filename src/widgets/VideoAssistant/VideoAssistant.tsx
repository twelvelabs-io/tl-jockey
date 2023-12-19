import React, { useEffect } from 'react'
import { ReactComponent as LogoIcon } from '../../icons/logo.svg'
import { initializeApp } from 'firebase/app'
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage'
import ModalCentral from '../../components/Modal/ModalCentral'
import VideoSelect from '../VideoSelector/VideoSelector'
import ChatSelector, { type ChatSelectProps } from '../ChatSelector/ChatSelector'
import { Link } from 'react-router-dom'

import { useChat, ActionType } from './hooks/useChat'
import useAutofillQuestions from './hooks/useAutofillQuestions'
import useVideo from './hooks/useVideo'

export interface Message {
  sender: 'user' | 'ai'
  text: string
  link: string | '' | undefined
  linkText: string | '' | undefined
  twelveText: string | '' | undefined
  asrTest: string | '' | undefined
  lameText: string | '' | undefined
  question: string | '' | undefined
}

const firebaseConfig = {
  apiKey: 'AIzaSyCeRQg_RDnj9t9NjWHbxaUmTlm__NdW9EE',
  authDomain: 'shark-6c3ab.firebaseapp.com',
  projectId: 'shark-6c3ab',
  storageBucket: 'shark-6c3ab.appspot.com',
  messagingSenderId: '780237476552',
  appId: '1:780237476552:web:10288c72abd0bcd942cbfd'
}
const app = initializeApp(firebaseConfig)
const storage = getStorage(app)
const listRef = ref(storage)

const VideoAssistant: React.FC = () => {
  const [chatState, chatDispatch] = useChat()
  const { valuesVideo, actionsVideo } = useVideo()
  const { valuesAutofillQuestions, actionsAutofillQuestions } = useAutofillQuestions()

  const {
    setChoosedElement,
    setAutofillApi,
    setShowAutofillQuestions
  } = actionsAutofillQuestions

  const {
    choosedElement,
    autofillApi,
    showAutofillQuestions
  } = valuesAutofillQuestions

  const {
    videoFiles,
    currentVideoFile,
    chatContainerRef,
    submitButtonRef,
    videoRef
  } = valuesVideo

  const {
    setVideoFiles,
    setCurrentVideoFile
  } = actionsVideo

  const handleClose = (): void => { chatDispatch({ type: ActionType.SET_SHOW_MODAL, payload: false }) }

  useEffect(() => {
    listAll(listRef)
      .then((res) => {
        const videoUrls = res.items.map((itemRef) => {
          return itemRef.fullPath
        })

        Promise.all(videoUrls)
          .then((urls) => {
            setVideoFiles(urls)
          })
          .catch((error) => {
            console.error('Error fetching video URLs:', error)
          })
      })
      .catch((error) => {
        console.error('Error listing files:', error)
      })
  }, [])

  const chatSelectProps: ChatSelectProps = {
    chatState,
    chatDispatch,
    submitButtonRef,
    setCurrentVideoFile,
    setShowAutofillQuestions,
    showAutofillQuestions,
    videoRef,
    setAutofillApi,
    setChoosedElement,
    storage,
    videoFiles,
    currentVideoFile,
    chatContainerRef
  }

  return (
    <div className={'fixed top-0 left-0 right-0 bottom-0'}>
        <div className={'text-center justify-between flex p-6 border-b-[1px] border-[#E5E6E4]'}>
          <LogoIcon />
          <div className={'flex flex-row gap-8'}>
          <Link to="/Chat">
              <button>
                <p className={'font-aeonikBold text-[16px] leading-5 hover:text-[#006F33]'}>Chat</p>
              </button>
            </Link>
            <Link to="/Index">
              <button>
                <p className={'font-aeonikBold text-[16px] leading-5 hover:text-[#006F33]'}>Index</p>
              </button>
            </Link>
          </div>
          <div></div>
        </div>
      <div className={'flex'}>
        <VideoSelect
          chatDispatch={chatDispatch}
          setCurrentVideoFile={setCurrentVideoFile}
          setShowAutofillQuestions={setShowAutofillQuestions}
          videoRef={videoRef}
          getDownloadURL={getDownloadURL}
          storage={storage}
          videoFiles={videoFiles}
          currentVideoFile={currentVideoFile}/>
        <ChatSelector {...chatSelectProps}/>
      </div>
      <ModalCentral
        chatState={chatState}
        chatDispatch={chatDispatch}
        handleClose={handleClose}
        choosedElement={choosedElement}
        autofillApi={autofillApi} />
    </div>
  )
}

export default VideoAssistant
