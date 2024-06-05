import { MouseEventHandler } from "react";

export interface ChipProps {
    children: React.ReactNode;
    isHovered: boolean;
    onMouseEnter: MouseEventHandler<HTMLDivElement>;
    onMouseLeave: MouseEventHandler<HTMLDivElement>;
    onClick: MouseEventHandler<HTMLDivElement>;
  }