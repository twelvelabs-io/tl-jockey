import React from 'react';
import { PaginationProps } from './PaginationTypes';
import LeftArrow from './LeftArrow';
import RightArrow from './RightArrow';
import { ModalType } from '../../types/messageTypes';
import { useChat } from '../../widgets/VideoAssistant/hooks/useChat';

const Pagination: React.FC<PaginationProps> = ({ chosenIndex, handlePageChange, totalIndexes }) => {
  const [state, dispatch] = useChat()
  const { modalType, panelVideosList } = state

  const findCurrentPosition = (array: any[], chosenIndex: number): number => {
    return array.findIndex((item) => item._id === chosenIndex);
  };

  const handlePreviousPage = () => {
    if (modalType === ModalType.MESSAGES) {
      let newIndex = chosenIndex - 1;
      if (newIndex < 0) {
        newIndex = totalIndexes - 1; 
      }
      handlePageChange(newIndex, totalIndexes);

    } else {
      const currentPos = findCurrentPosition(panelVideosList, chosenIndex)
      let newPos = currentPos - 1;
      if (newPos < 0) {
        newPos = panelVideosList.length - 1;
      }
      handlePageChange(newPos, totalIndexes)
    }
  };

  const handleNextPage = () => {
    if (modalType === ModalType.MESSAGES) {
      handlePageChange(chosenIndex + 1, totalIndexes);
    } else {
      const currentPos = findCurrentPosition(panelVideosList, chosenIndex)
      let newPos = currentPos + 1
      handlePageChange(newPos, totalIndexes)
    }

  };

  return (
    <div className="flex items-center">
        <LeftArrow 
          className='cursor:pointer flex items-center justify-center gap-2 py-2 rounded-[32px]  text-gray-700'
          onClick={handlePreviousPage}
        />
        <RightArrow
          onClick={handleNextPage}
          className="cursor:pointer flex items-center justify-center gap-2 mx-3 py-2 rounded-[32px]  text-gray-700"
        />
    </div>
  );
};

export default Pagination;
