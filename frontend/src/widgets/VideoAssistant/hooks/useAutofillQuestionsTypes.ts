export interface UseAutofillQuestionsProps {
    choosedElement: number | undefined
    autofillApi: boolean
    showAutofillQuestions: boolean
  }
  
export interface UseAutofillQuestions {
    valuesAutofillQuestions: UseAutofillQuestionsProps
    actionsAutofillQuestions: {
      setChoosedElement: React.Dispatch<React.SetStateAction<number | undefined>>
      setAutofillApi: React.Dispatch<React.SetStateAction<boolean>>
      setShowAutofillQuestions: React.Dispatch<React.SetStateAction<boolean>>
    }
  }