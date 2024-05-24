import React from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export const SkeletonChatVideoCard = ({}) => {
    return (
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
        <div className="flex flex-row gap-1 cursor-pointer">
          <div className="relative cursor-pointer">
            {/* Skeleton for the video thumbnail */}
            <Skeleton className="rounded" width={102} height={56} />
          </div>
          {/* Skeleton for the text part */}
          <div className="flex flex-col">
            <Skeleton className="font-normal text-sm text-gray-500" width={140} />
            <Skeleton className="font-normal text-sm text-gray-500" width={90} />
          </div>
        </div>
        </SkeletonTheme>
    )
}

export default SkeletonChatVideoCard
