// Pagination.tsx
import React from 'react';
import { ReactComponent as ArrowIconLeft } from '../../icons/ChevronLeft.svg';
import { ReactComponent as ArrowIconRight } from '../../icons/ChevronRight.svg';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  showArrows: boolean;
  handlePageChange: (newPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, showArrows, handlePageChange }) => {
  return (
    <div className="flex items-center justify-center mt-4">
      {showArrows && currentPage > 1 && (
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700"
        >
          <ArrowIconLeft />
        </button>
      )}

      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          onClick={() => handlePageChange(index + 1)}
          className={`mx-2 px-4 py-2 rounded-[32px] ${currentPage === index + 1 ? 'bg-[#F7F7FA] rounded-2xl' : ''}`}
        >
          {index + 1}
        </button>
      ))}

      {showArrows && currentPage < totalPages && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="mx-2 px-4 py-2 rounded-[32px] bg-gray-300 text-gray-700"
        >
          <ArrowIconRight />
        </button>
      )}
    </div>
  );
};

export default Pagination;
