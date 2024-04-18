import React, { useState } from 'react';
import { AutofillQuestionsItemProps } from './AutofillQuestionsItemTypes';

const AutofillQuestionsItem: React.FC<AutofillQuestionsItemProps> = ({ question, index, handleQuestionClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    handleQuestionClick(question);
  };

  return (
    <div
      className={`cursor-pointer pt-3 pr-5 pb-3 pl-5 rounded-full ${isHovered ? 'bg-[#F4F4F3] border-[#F4F4F3] border-1' : 'bg-[#F7FEF2] border-1 border-[#DBFEBE]'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      key={index}
    >
      <p className="font-aeonik text-[16px]">{question}</p>
    </div>
  );
};

export default AutofillQuestionsItem;
