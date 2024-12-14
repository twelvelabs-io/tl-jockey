import { type State } from '../VideoAssistant/hooks/useChatTypes'

export interface ChatFormProps {
    submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>
    autofillQuestions: string[]
    setAutofillApi: (file: boolean) => void
    handleChatApi: () => void
    showAutofillQuestions: boolean
    setShowAutofillQuestions: (show: boolean) => void,
    inputBoxStyle: string
}