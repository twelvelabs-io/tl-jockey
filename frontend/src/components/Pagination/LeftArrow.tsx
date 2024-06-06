import React from 'react';
import { ReactComponent as ArrowIconLeft } from '../../icons/ArrowLeftPopUp.svg';
import { ArrowProps, ArrowsText } from './ArrowsTypes';

const LeftArrow: React.FC<ArrowProps> = ({ onClick, className }) => (
  <button onClick={onClick} className={className}>
    <ArrowIconLeft />
    <div className="div">
      <p className={'font-aeonik text-[16px] text-black bg-opacity-60'}>
        {ArrowsText.PREVIOUS}
      </p>
    </div>
  </button>
);

export default LeftArrow;
