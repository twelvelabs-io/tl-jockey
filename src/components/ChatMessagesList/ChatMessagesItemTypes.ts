import { type QuestionMessage } from '../../types/messageTypes'

export interface ChatMessagesItemProps {
    message: QuestionMessage
    index: number
    handleClick: (event: React.MouseEvent<HTMLSpanElement>) => void
    handleShow: (index: number | undefined, question: string) => void
    key: number
}