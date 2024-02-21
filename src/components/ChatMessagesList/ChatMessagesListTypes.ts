import { type State } from '../../widgets/VideoAssistant/hooks/useChatTypes'

export interface ChatMessagesListProps {
    chatState: State
    chatDispatch: React.Dispatch<any>
    videoRef: React.RefObject<HTMLVideoElement>
    setChoosedElement: (file: number | undefined) => void
}