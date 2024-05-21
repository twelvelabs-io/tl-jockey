import React, { Suspense } from "react";
import FallBackVideoPlaceholder from "../../components/Fallback/FallBackVideoPlaceholder";
import { ErrorBoundary } from "react-error-boundary";
import PanelVideoItem from "./PanelVideoItem";
import ErrorFallBack from "../../components/Fallback/ErrorFallBack";

interface PanelListProps {
    videos: any;
    refetchVideos: any;
}

const PanelList: React.FC<PanelListProps> = ({ videos, refetchVideos }) => {
    return (
        <div className="overflow-y-auto h-[75vh] pl-5 pr-5 flex flex-col gap-4">
            {videos.map((video: any, index: any) => (
                <ErrorBoundary FallbackComponent={ErrorFallBack} onReset={refetchVideos}>
                    <Suspense fallback={<FallBackVideoPlaceholder size='small'/>}>
                        <PanelVideoItem videoID={video._id} />
                    </Suspense>
                </ErrorBoundary>
            ))}
        </div>
    );
};

export default PanelList;
