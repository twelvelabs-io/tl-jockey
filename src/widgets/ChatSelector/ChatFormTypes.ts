import { type State } from '../VideoAssistant/hooks/useChatTypes'

export interface ChatFormProps {
    chatState: State
    chatDispatch: React.Dispatch<any>
    submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
    autofillQuestions: string[]
    setAutofillApi: (file: boolean) => void
    handleChatApi: () => void
    showAutofillQuestions: boolean
    setShowAutofillQuestions: (show: boolean) => void
}