import React from "react"
import ArrowIcon from "../../icons/ArrowIcon"
import { Message } from "./AIResponse"

interface SeeMoreResultsButtonProps {
    showAllVideos: boolean,
    message: Message,
    setShowAllVideos: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SeeMoreResultsButton: React.FC<SeeMoreResultsButtonProps> = ({ showAllVideos, setShowAllVideos, message }) => {
    const videosAmountLeft = message?.toolsData && message.toolsData.length - 3
    return (
        <button 
            onClick={() => setShowAllVideos(!showAllVideos)} 
            className={'text-[#006F33] flex flex-row gap-1 justify-center items-center font-aeonik'}
        >
            {showAllVideos ? 'Show Less' : `See ${videosAmountLeft} more results`}
            <ArrowIcon direction={showAllVideos}/>
      </button>
    )
}

export default SeeMoreResultsButton