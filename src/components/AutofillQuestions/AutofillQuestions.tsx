import React from 'react'
import { ChatSelectQuestions } from '../../constants'
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
    <div className={'mb-2 flex w-full justify-center items-start flex-col bg-[#fff] shadow-md border border-solid border-[#D4D5D2] '}>
        <div className={'text-[12px] font-semibold text-gray-500 p-2 font-aeonik sans-serif'}>{ChatSelectQuestions.TOP_QUESTIONS}</div>
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
