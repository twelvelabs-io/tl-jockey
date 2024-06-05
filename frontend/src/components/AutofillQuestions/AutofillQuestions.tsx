import React from 'react'
import AutofillQuestionsItem from './AutofillQuestionsItem'
import { ActionType, useChat } from '../../widgets/VideoAssistant/hooks/useChat'
import { AutofillQuestionsProps } from './AutofillQuestionsTypes'

const AutofillQuestions: React.FC<AutofillQuestionsProps> = ({ autofillQuestions }) => {
  const [state, dispatch] = useChat()
  const handleQuestionClick = (question: string): void => {
    dispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: question })
    dispatch({ type: ActionType.SET_INPUT_BOX, payload: question })
  }

  return (
    <div className={'mb-2 flex w-full justify-center items-start flex-col gap-[12px]'}>
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
