import { type State } from '../../widgets/VideoAssistant/hooks/useChatTypes'

export interface QuestionHeaderProps {
    logo: string
    handleClose: () => void
    text: string
}

export interface ModalCentralProps {
    chatState: State
    chatDispatch: React.Dispatch<any>
    handleClose: () => void
    choosedElement: number | undefined
    autofillApi: boolean
}

export interface HeaderModalProps {
    modelLogo: string
    modelName: string
    backgroundColor: string
}

export interface ColumnModalProps {
    modelLogo: string
    modelName: string
    backgroundColor: string
    text?: string[]
    className: string
}

export interface ColumnGroupProps {
    columnData: Array<{
      className: string
      modelLogo: string
      modelName: string
      backgroundColor: string
      text: string[]
    }>
}