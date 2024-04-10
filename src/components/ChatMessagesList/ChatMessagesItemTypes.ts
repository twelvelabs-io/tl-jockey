import { type QuestionMessage } from '../../types/messageTypes'
import { State } from '../../widgets/VideoAssistant/hooks/useChatTypes'

export interface ChatMessagesItemProps {
    message: QuestionMessage
    index: number
    handleClick: (event: React.MouseEvent<HTMLSpanElement>) => void
    handleShow: (index: number | undefined, question: string) => void
    key: number
    chatState: State
}