import React from 'react'
import helpersFunctions from '../../helpers/helpers';

interface PanelVideosSummaryProps {
    videosLength: string
}

export const PanelVideosSummary:React.FC<PanelVideosSummaryProps> = ({ videosLength }) => {
    const dynamicVideosLengthName  = helpersFunctions.getVideoWordDynamic(length)
    return (
        <div className="pt-[24px] pb-2 pl-5">
            <p className="text-[#333431] font-aeonik text-sm font-medium">
                { videosLength } {dynamicVideosLengthName }
            </p>
        </div>
    )
}

export default PanelVideosSummary