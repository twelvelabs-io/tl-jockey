import React from 'react';
import { PaginationProps } from './PaginationTypes';
import LeftArrow from './LeftArrow';
import RightArrow from './RightArrow';

const Pagination: React.FC<PaginationProps> = ({ chosenIndex, handlePageChange, totalIndexes }) => {
  const handlePreviousPage = () => {
    let newIndex = chosenIndex - 1;
    if (newIndex < 0) {
      newIndex = totalIndexes - 1; 
    }
    handlePageChange(newIndex, totalIndexes);
  };

  const handleNextPage = () => {
    handlePageChange(chosenIndex + 1, totalIndexes);
  };

  return (
    <div className="flex items-center justify-end mt-4">
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
