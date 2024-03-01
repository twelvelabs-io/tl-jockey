import React from 'react';
import { CentralPointsProps } from './CentralPointsTypes';

const CentralPoints: React.FC<CentralPointsProps> = ({ currentPage, totalPages, handlePageChange }) => {
  const renderPageNumbers = (): JSX.Element[] => {
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1); // I'm generating Pagination numbers from 1

    return pageNumbers.map(pageNumber => (
      <button
        key={pageNumber}
        onClick={() => handlePageChange(pageNumber)}
        className={`mx-2 px-4 py-2 rounded-[32px] ${currentPage === pageNumber ? 'bg-[#F7F7FA] rounded-2xl' : ''}`}
      >
        {pageNumber}
      </button>
    ));
  };
  return (
    <>
      {renderPageNumbers()}
    </>
  );
};

export default CentralPoints;
