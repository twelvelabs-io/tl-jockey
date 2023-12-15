import { useState } from 'react'

interface UseAutofillQuestionsProps {
  choosedElement: number | undefined
  autofillApi: boolean
  showAutofillQuestions: boolean
}

interface UseAutofillQuestions {
  valuesAutofillQuestions: UseAutofillQuestionsProps
  actionsAutofillQuestions: {
    setChoosedElement: React.Dispatch<React.SetStateAction<number | undefined>>
    setAutofillApi: React.Dispatch<React.SetStateAction<boolean>>
    setShowAutofillQuestions: React.Dispatch<React.SetStateAction<boolean>>
  }
}

function useAutofillQuestions (): UseAutofillQuestions {
  const [choosedElement, setChoosedElement] = useState<number | undefined>()
  const [autofillApi, setAutofillApi] = useState<boolean>(false)
  const [showAutofillQuestions, setShowAutofillQuestions] = useState<boolean>(false)

  return {
    valuesAutofillQuestions: {
      choosedElement,
      autofillApi,
      showAutofillQuestions
    },
    actionsAutofillQuestions: {
      setChoosedElement,
      setAutofillApi,
      setShowAutofillQuestions
    }
  }
}

export default useAutofillQuestions
