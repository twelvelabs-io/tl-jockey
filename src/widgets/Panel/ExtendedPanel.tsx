/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import React, { Suspense, useEffect } from 'react'
import { useQueryClient } from 'react-query';
import { useGetVideos } from '../../apis/hooks';
import keys from '../../apis/keys';
import Loading from '../../components/Loading/Loading';
import PanelList from '../PanelList/PanelList';
import { ErrorBoundary } from 'react-error-boundary';
import PanelHeader from './PanelHeader';
import PanelVideosSummary from './PanelVideosSummary';
import SkeletonPanelVideoCard from '../../skeletons/SkeletonPanelVideoCard';

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
    const indexID = process.env.REACT_APP_API_INDEX_ID
    const {
        data: videosData,
        refetch: refetchVideos,
        isPreviousData,
      } = useGetVideos(indexID, 1, 50);
      const videos = videosData?.data;
      
      useEffect(() => {
        queryClient.invalidateQueries({
          queryKey: [keys.VIDEOS, indexID, 1],
        });
      }, []);

      const videosLength = videos?.length
    return (
        <div className={`w-[380px] bg-[#F9FAF9] border-r-2 border-r-[#E5E6E4] h-screen`}>
            <PanelHeader toggleWidth={toggleWidth}/>
            <ErrorBoundary FallbackComponent={ErrorFallback} >
                {videos ? (
                        <>
                            <PanelVideosSummary videosLength={videosLength}/>
                            <Suspense fallback={<Loading />}>
                                <PanelList videos={videos} refetchVideos={refetchVideos} />
                            </Suspense>
                        </>
                    ) : (
                        <>
                        <div className="pt-[24px] pb-2 pl-5">
                            <p className="text-[#333431] font-aeonik text-sm font-medium">
                                Loading videos...
                            </p>
                        </div>
                        <SkeletonPanelVideoCard/>
                        </>
                    )}
            </ErrorBoundary>
        </div>
    )
}

export default ExtendedPanel