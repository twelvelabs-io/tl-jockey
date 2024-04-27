/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import React, { Suspense, useEffect } from 'react'
import { ReactComponent as SideBarIconBack } from '../../icons/SideBarClose.svg'
import { ReactComponent as VideoChatPlayer } from '../../icons/VideoChatPlayer.svg'
import { useQueryClient } from 'react-query';
import { useGetVideos } from '../../apis/hooks';
import keys from '../../apis/keys';
import Loading from '../../components/Loading/Loading';
import PanelList from '../PanelList/PanelList';

interface ExtendedPanelProps {
    toggleWidth: () => void;
}

export const ExtendedPanel:React.FC<ExtendedPanelProps> = ({ toggleWidth }) => {

    const queryClient = useQueryClient()
    const {
        data: videosData,
        refetch: refetchVideos,
        isPreviousData,
      } = useGetVideos('659f2e829aba4f0b402f6488', 1, 50);
      const videos = videosData?.data;
      
      useEffect(() => {
        queryClient.invalidateQueries({
          queryKey: [keys.VIDEOS, '659f2e829aba4f0b402f6488', 1],
        });
      }, []);
      console.log(videos)

    return (
        <div className={`w-[380px] bg-[#F9FAF9] relative h-[100vh] border-r-2 border-r-[#E5E6E4] transition-width duration-500 ease-in-out`}>
            <div className={`right-0 pr-[20px] pt-[20px] cursor-pointer flex justify-between pl-[20px]`} onClick={toggleWidth}>
                <div className="flex flex-row justify-center items-center gap-1">
                    <VideoChatPlayer/>
                    <p className='text-[16px] text-[#333431] font-aeonik'>Video Chat Assistant</p>
                </div>
                <SideBarIconBack/>
            </div>
            {videos && (
                    <>
                        <div className="pt-[24px] pb-2 pl-5">
                            <p className='text-[#333431] font-aeonik text-sm font-medium'>
                                {videos.length} videos
                            </p>
                        </div>
                        <Suspense fallback={<Loading/>}>
                            <PanelList
                            videos={videos}
                            refetchVideos={refetchVideos}
                            />
                        </Suspense>
                    </>
                    )}
        </div>
    )
}

export default ExtendedPanel