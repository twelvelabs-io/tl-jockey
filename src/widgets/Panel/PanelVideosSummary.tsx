import React from 'react'

interface PanelVideosSummaryProps {
    videosLength: string
}

export const PanelVideosSummary:React.FC<PanelVideosSummaryProps> = ({ videosLength }) => {
    return (
        <div className="pt-[24px] pb-2 pl-5">
            <p className="text-[#333431] font-aeonik text-sm font-medium">
                { videosLength } videos
            </p>
        </div>
    )
}

export default PanelVideosSummary