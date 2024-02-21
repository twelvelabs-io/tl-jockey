import React from 'react';
import { ReactComponent as ArrowIconRight } from '../../icons/ChevronRight.svg'
import { ArrowProps } from './ArrowsTypes';

const RightArrow: React.FC<ArrowProps> = ({ onClick, className }) => (
  <button onClick={onClick} className={className}>
    <ArrowIconRight />
  </button>
);

export default RightArrow;
