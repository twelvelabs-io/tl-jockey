import React from 'react';
import { PaginationProps } from './PaginationTypes';
import LeftArrow from './LeftArrow';
import RightArrow from './RightArrow';
import CentralPoints from './CentralPoints';

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, showArrows, handlePageChange }) => {
  return (
    <div className="flex items-center justify-center mt-4">

      {showArrows && currentPage > 1 && (
        <LeftArrow 
        className='mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700'
        onClick={() => handlePageChange(currentPage - 1)}/>
      )}

      <CentralPoints
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />

      {showArrows && currentPage < totalPages && (
        <RightArrow
          onClick={() => handlePageChange(currentPage + 1)}
          className="mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700"
        />
      )}
      
    </div>
  );
};

export default Pagination;
