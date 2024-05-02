import { QuestionMessage } from "../../types/messageTypes"


export interface ChatMessagesListProps {
    videoRef: React.RefObject<HTMLVideoElement>
    setChoosedElement: (file: number | undefined) => void,
    arrayMessages: QuestionMessage[],
    handleShow: (index: number | undefined, questions: string) => void
}
