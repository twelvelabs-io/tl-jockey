import React from 'react'
import AutofillQuestionsItem from './AutofillQuestionsItem'
import { ActionType } from '../../widgets/VideoAssistant/hooks/useChat'
import { AutofillQuestionsProps } from './AutofillQuestionsTypes'

const AutofillQuestions: React.FC<AutofillQuestionsProps> = ({ autofillQuestions, chatDispatch, setShowAutofillQuestions }) => {
  const handleQuestionClick = (question: string): void => {
    chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: question })
    chatDispatch({ type: ActionType.SET_INPUT_BOX, payload: question })
    setShowAutofillQuestions(false)
  }

  return (
    <div className={'mb-2 flex w-full justify-center items-start flex-col gap-2'}>
        {autofillQuestions.map((question, index) => (
            <AutofillQuestionsItem
                key={index}
                question={question}
                index={index}
                handleQuestionClick={handleQuestionClick}
            />
        ))}
    </div>
  )
}

export default AutofillQuestions
