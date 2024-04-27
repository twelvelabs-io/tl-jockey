import React, { useState } from "react";
import { ReactComponent as SideBarIcon } from '../../icons/SideBar.svg';
import { ReactComponent as SideBarIconBack } from '../../icons/SideBarClose.svg'
import { ReactComponent as VideoChatPlayer } from '../../icons/VideoChatPlayer.svg'
import ExtendedPanel from "./ExtendedPanel";

interface PanelWrapperProps {

}

export const PanelWrapper:React.FC<PanelWrapperProps> = ({}) => {
    const [expanded, setExpanded] = useState(false);

    const toggleWidth = () => {
        setExpanded(!expanded);
    };
    
    return (
        expanded ? <ExtendedPanel toggleWidth={toggleWidth}/> : (
            <div className={`min-w-[64px] bg-[#F9FAF9] relative h-[100vh] border-r-2 border-r-[#E5E6E4] transition-width duration-500 ease-in-out`}>
                <div className={`'left-0 pl-[20px] pt-[20px] cursor-pointer absolute `} onClick={toggleWidth}>
                    <SideBarIcon/>
                </div>
            </div>
        )
    )
}

export default PanelWrapper