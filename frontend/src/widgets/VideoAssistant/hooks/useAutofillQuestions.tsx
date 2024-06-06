import { useState } from 'react'
import { UseAutofillQuestions } from './useAutofillQuestionsTypes'

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
