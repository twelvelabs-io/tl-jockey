import React from 'react'
import { SubmitButtonProps, ButtonText } from './SubmitButtonTypes'

const SubmitButton: React.FC<SubmitButtonProps> = ({
  submitButtonRef,
  autofillQuestions,
  responseText,
  setAutofillApi,
  handleChat,
  handleChatApi
}) => {
  return (
    <button
      onClick={() => {
        setAutofillApi(false)
        handleChatApi()
      }}
      ref={submitButtonRef}
      className={'btn-primary-submit'}
    >
      {ButtonText.BUTTON_TEXT}
    </button>
  )
}

export default SubmitButton
