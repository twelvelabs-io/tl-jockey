import React from 'react';

interface ArrowIconProps {
    direction: boolean; 
  }
const ArrowIcon: React.FC<ArrowIconProps> = ({ direction }) => {

  return (
    <div>
      {direction ? (
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M11.5338 5.02539L10.4668 6.30577L6.00028 2.58368L1.53377 6.30577L0.466797 5.02539L6.00028 0.414165L11.5338 5.02539Z" fill="#006F33"/>
        </svg>
      ) : (
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M0.466797 1.97355L1.53377 0.693176L6.00028 4.41527L10.4668 0.693176L11.5338 1.97355L6.00028 6.58478L0.466797 1.97355Z" fill="#006F33"/>
        </svg>
      )}
    </div>
  );
};

export default ArrowIcon;