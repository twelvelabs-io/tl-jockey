export interface QuestionHeaderProps {
    logo: string
    handleClose: () => void
    text: string
}

export interface ModalCentralProps {
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

export enum textsClearModal {
    header = 'Would you like to delete the chat history?',
    body = 'Clearing the chat thread will remove all messages.'
}

export enum textsModalCentral {
    linksForNfl = "Credits to the NFL YouTube Channel"
}