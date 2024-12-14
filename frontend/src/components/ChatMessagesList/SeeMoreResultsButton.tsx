import React from "react"
import ArrowIcon from "../../icons/ArrowIcon"
import { QuestionMessage } from "../../types/messageTypes";

interface SeeMoreResultsButtonProps {
    showAllVideos: boolean,
    message: QuestionMessage,
    setShowAllVideos: React.Dispatch<React.SetStateAction<boolean>>;
    videosUrls: QuestionMessage['toolsData']
}

export const SeeMoreResultsButton: React.FC<SeeMoreResultsButtonProps> = ({ showAllVideos, setShowAllVideos, message, videosUrls }) => {
    const videosAmountLeft = videosUrls.length - 3
    return (
        <button 
            onClick={() => setShowAllVideos(!showAllVideos)} 
            className={'text-[#006F33] flex flex-row gap-1 justify-start items-center font-aeonik text-sm'}
        >
            {showAllVideos ? 'Show Less' : `See ${videosAmountLeft} more results`}
            <ArrowIcon direction={showAllVideos}/>
      </button>
    )
}

export default SeeMoreResultsButton