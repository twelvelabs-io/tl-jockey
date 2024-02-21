import React from 'react'
import { AutofillQuestionsItemProps } from './AutofillQuestionsItemTypes'

const AutofillQuestionsItem: React.FC<AutofillQuestionsItemProps> = ({ question, index, handleQuestionClick }) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#F4F4F3';
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'initial';
  }

  const handleClick = () => {
    handleQuestionClick(question);
  }

  return (
    <div
        className="p-2 cursor-pointer w-full font-aeonik"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        key={index}
    >
        {question}
    </div>
  )
}

export default AutofillQuestionsItem
