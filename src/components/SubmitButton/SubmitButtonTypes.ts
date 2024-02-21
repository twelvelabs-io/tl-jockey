export interface SubmitButtonProps {
    submitButtonRef: React.RefObject<HTMLButtonElement>
    autofillQuestions: string[]
    responseText: string
    setAutofillApi: (value: boolean) => void
    handleChat: () => void
    handleChatApi: () => void
  }
  
export enum ButtonText {
    BUTTON_TEXT = 'Submit',
    BUTTON_UPLOAD = "Upload"
}