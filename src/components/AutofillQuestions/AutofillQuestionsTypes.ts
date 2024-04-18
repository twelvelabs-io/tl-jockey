export interface AutofillQuestionsProps {
    chatDispatch: React.Dispatch<any>
    setShowAutofillQuestions: (show: boolean) => void
    autofillQuestions: string[]
}

export const autofillQuestions: string[] = [
    'Find the top clip of a touchdown',
    'Find the top 3 clips of a touchdown',
    'Find the top 5 clips of a touchdown'
];