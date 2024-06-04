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
    //overflow-y-auto h-[100vh] pl-5 pr-5 flex flex-col gap-4
    return (
        <div className="overflow-y-auto pl-5 pr-5 flex flex-col gap-4" style={{ height: "calc(100vh - 166px)" }}>
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
