import React, { Suspense } from "react";
import FallBackVideoPlaceholder from "../../components/Fallback/FallBackVideoPlaceholder";
import keys from "../../apis/keys";
import PanelVideoItem from "./PanelVideoItem";

interface PanelListProps {
    videos: any;
    refetchVideos: any;
}

const PanelList: React.FC<PanelListProps> = ({ videos, refetchVideos }) => {
    return (
        <div className="overflow-y-auto max-h-[85vh] pl-5 pr-5 flex flex-col gap-3">
            {videos.map((video: any, index: any) => (
                    <Suspense fallback={<FallBackVideoPlaceholder size='small'/>}>
                        <PanelVideoItem videoID={video._id} />
                    </Suspense>
            ))}
        </div>
    );
};

export default PanelList;
