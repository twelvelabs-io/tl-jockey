import React from 'react'
import ModalCentral from '../../components/Modal/ModalCentral'
import ChatSelector from '../ChatSelector/ChatSelector'
import { type ChatSelectProps } from '../ChatSelector/ChatSelectorTypes'

import { useChat, ActionType } from './hooks/useChat'
import useAutofillQuestions from './hooks/useAutofillQuestions'
import useVideo from './hooks/useVideo'
import VideoAssistantHeader from './VideoAssistantHeader'

const VideoAssistant: React.FC = () => {
  const [state, dispatch] = useChat()
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
    setCurrentVideoFile
  } = actionsVideo

  const handleClose = (): void => { dispatch({ type: ActionType.SET_SHOW_MODAL, payload: false }) }

  const chatSelectProps: ChatSelectProps = {
    submitButtonRef,
    setCurrentVideoFile,
    setShowAutofillQuestions,
    showAutofillQuestions,
    videoRef,
    setAutofillApi,
    setChoosedElement,
    videoFiles,
    currentVideoFile,
    chatContainerRef
  }

  return (
    <div className={'fixed top-0 left-0 right-0 bottom-0'}>
      <VideoAssistantHeader/>
      <div className={'w-full'}>
        <ChatSelector {...chatSelectProps}/>
      </div>
      <ModalCentral
        handleClose={handleClose}
        choosedElement={choosedElement}
        autofillApi={autofillApi} />
    </div>
  )
}

export default VideoAssistant
