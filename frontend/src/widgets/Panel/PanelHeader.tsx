import React from 'react'
import { ReactComponent as SideBarIconBack } from '../../icons/SideBarClose.svg'
import { ReactComponent as VideoChatPlayer } from '../../icons/VideoChatPlayer.svg'

interface PanelHeaderProps {
    toggleWidth: () => void
}

export const PanelHeader:React.FC<PanelHeaderProps> = ({toggleWidth}) => {

    return (
        <div className={`right-0 pr-[20px] pt-[20px] cursor-pointer flex justify-between pl-[20px]`} onClick={toggleWidth}>
            <div className="flex flex-row justify-center items-center gap-1">
                <VideoChatPlayer/>
                <p className='text-[16px] text-[#333431] font-aeonik'>Video Chat Assistant</p>
            </div>
            <SideBarIconBack/>
        </div>
    )
}

export default PanelHeader