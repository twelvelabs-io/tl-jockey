import React from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export const SkeletonPanelVideoCard = ({}) => {
    return (
        <section className='overflow-y-auto max-h-[85vh] pl-5 pr-5 flex flex-col gap-3'>
            <ul className="list">
            {Array(9).fill(undefined) 
                .map((item, index) => (
                <li key={index}>
                        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
                            <div className="flex flex-row gap-1 cursor-pointer">
                                <div className="relative cursor-pointer">
                                {/* Skeleton for the image */}
                                    <Skeleton className="rounded" width={102} height={56} />
                                </div>

                                {/* Skeleton for the text */}
                                <div className="flex flex-col">
                                    <div>
                                        <Skeleton className="font-normal text-sm text-gray-500" width={180}/>
                                    </div>
                                    <div>
                                        <Skeleton className="font-normal text-sm text-gray-500" width={120}/>
                                    </div>
                                </div>
                            </div>
                            </SkeletonTheme>
                </li>
                ))}
            </ul>
      </section>
    )
}

export default SkeletonPanelVideoCard