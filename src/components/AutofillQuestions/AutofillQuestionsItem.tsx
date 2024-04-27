import React, { useState } from 'react';
import { AutofillQuestionsItemProps } from './AutofillQuestionsItemTypes';
import Chip from './Chip'

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
    <Chip 
      isHovered={isHovered} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
      onClick={handleClick}
    >
      {question}
    </Chip>
  );
};

export default AutofillQuestionsItem;
