import React from 'react'

interface SubmitButtonProps {
  submitButtonRef: React.RefObject<HTMLButtonElement>
  autofillQuestions: string[]
  responseText: string
  setAutofillApi: (value: boolean) => void
  handleChat: () => void
  handleChatApi: () => void
}

export enum Button {
  BUTTON_TEXT = 'Submit',
  BUTTON_UPLOAD = "Upload"
}

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
        // if (autofillQuestions.some((question) => question === responseText)) {
        //   setAutofillApi(true)
        //   handleChat()
        // } else {
          setAutofillApi(false)
          handleChatApi()
        // }
      }}
      ref={submitButtonRef}
      className={'btn-primary-submit'}
    >
      {Button.BUTTON_TEXT}
    </button>
  )
}

export default SubmitButton
