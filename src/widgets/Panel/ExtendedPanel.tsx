/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import React, { Suspense, useEffect } from 'react'
import { useQueryClient } from 'react-query';
import { useGetVideos } from '../../apis/hooks';
import keys from '../../apis/keys';
import Loading from '../../components/Loading/Loading';
import PanelList from '../PanelList/PanelList';
import { ErrorBoundary } from 'react-error-boundary';
import PanelHeader from './PanelHeader';

interface ExtendedPanelProps {
    toggleWidth: () => void;
}

interface ErrorFallbackProps {
    error: Error,
    resetErrorBoundary: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
    <div>
        <h2>Something went wrong.</h2>
        <p>{error.message}</p>
    </div>
);

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

    return (
        <div className={`w-[380px] bg-[#F9FAF9] relative h-[100vh] border-r-2 border-r-[#E5E6E4] transition-width duration-500 ease-in-out`}>
            <PanelHeader toggleWidth={toggleWidth}/>
            <ErrorBoundary FallbackComponent={ErrorFallback} >
                {videos ? (
                        <>
                            <div className="pt-[24px] pb-2 pl-5">
                                <p className="text-[#333431] font-aeonik text-sm font-medium">
                                    {videos.length} videos
                                </p>
                            </div>
                            <Suspense fallback={<Loading />}>
                                <PanelList videos={videos} refetchVideos={refetchVideos} />
                            </Suspense>
                        </>
                    ) : (
                        <div className="pt-[24px] pb-2 pl-5">
                            <p className="text-[#333431] font-aeonik text-sm font-medium">
                                No videos available
                            </p>
                    </div>
                    )}
            </ErrorBoundary>
        </div>
    )
}

export default ExtendedPanel