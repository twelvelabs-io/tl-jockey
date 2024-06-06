import React from 'react'
import { ReactComponent as SideBarIcon } from '../../icons/SideBar.svg';

interface DefaultPanelProps {
    toggleWidth: () => void
}

export const DefaultPanel:React.FC<DefaultPanelProps> = ({toggleWidth}) => {
    return (
            <div className={`min-w-[64px] bg-[#F9FAF9] relative h-[100vh] border-r-2 border-r-[#E5E6E4] transition-width duration-500 ease-in-out`}>
                <div className={`'left-0 pl-[20px] pt-[20px] cursor-pointer absolute `} onClick={toggleWidth}>
                    <SideBarIcon/>
                </div>
            </div>
    )
}

export default DefaultPanel