import React from 'react';
import { ReactComponent as ArrowIconLeft } from '../../icons/ChevronLeft.svg';
import { ArrowProps } from './ArrowsTypes';

const LeftArrow: React.FC<ArrowProps> = ({ onClick, className }) => (
  <button onClick={onClick} className={className}>
    <ArrowIconLeft />
  </button>
);

export default LeftArrow;
