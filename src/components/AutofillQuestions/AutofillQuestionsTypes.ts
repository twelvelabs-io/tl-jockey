export interface AutofillQuestionsProps {
    chatDispatch: React.Dispatch<any>
    setShowAutofillQuestions: (show: boolean) => void
    autofillQuestions: string[]
}