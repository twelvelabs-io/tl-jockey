import React from 'react'

interface AutofillQuestionsItemProps {
  question: string
  index: number
  handleQuestionClick: (question: string) => void
}

const AutofillQuestionsItem: React.FC<AutofillQuestionsItemProps> = ({ question, index, handleQuestionClick }) => {
  return (
    <div
        onMouseEnter={(e: any) => (e.target.style.backgroundColor = '#F4F4F3')}
        onMouseLeave={(e: any) => (e.target.style.backgroundColor = 'initial')}
        key={index} onClick={() => { handleQuestionClick(question) }}
        className={'p-2 cursor-pointer w-full font-aeonik'}
    >
        {question}
    </div>
  )
}

export default AutofillQuestionsItem
