import React from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export const SkeletonChatVideoCard = ({}) => {
    return (
      <ul className='flex flex-col gap-2'>
      {Array(3).fill(undefined) 
        .map((item, index) => (
        <li key={index}>
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
        <div className="flex flex-row gap-2 cursor-pointer">
          <div className="relative cursor-pointer">
            {/* Skeleton for the video thumbnail */}
            <Skeleton className="rounded" width={220} height={122} />
          </div>
          {/* Skeleton for the text part */}
          <div className="flex flex-col">
            <Skeleton className="font-normal text-sm text-gray-500" width={260} />
            <Skeleton className="font-normal text-sm text-gray-500" width={160} />
            <Skeleton className="font-normal text-sm text-gray-500" width={60} />
          </div>
        </div>
        </SkeletonTheme>
        </li>
        ))}
    </ul>
    )

}

export default SkeletonChatVideoCard
