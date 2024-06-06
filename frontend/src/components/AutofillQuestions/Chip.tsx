import React, { MouseEventHandler } from "react";
import { ChipProps } from "./ChipTypes";
  
export const Chip: React.FC<ChipProps> = ({ children, isHovered, onMouseEnter, onMouseLeave, onClick }) => {
    return (
      <div 
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave} 
        onClick={onClick} 
        className={`cursor-pointer pt-[12px] pr-5 pb-[12px] pl-5 rounded-full ${isHovered ? 'bg-[#F4F4F3] border-[#F4F4F3] border-1' : 'bg-[#F7FEF2] border-1 border-[#DBFEBE]'}`} >
          <p className="font-aeonik text-[16px]">{children}</p>
      </div>
    );
  };

  export default Chip