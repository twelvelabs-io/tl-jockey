import React from 'react';
import { VideoListHeaderTexts } from './IndexVideoListHeader';
import { ReactComponent as YoutubeIcon } from '../../icons/video.svg'

interface IndexVideoListHeaderLeft {
    videoTotalHoursformatted: string
    countOfVideo: number
}

const IndexVideoListHeaderLeft: React.FC<IndexVideoListHeaderLeft> = ({countOfVideo, videoTotalHoursformatted}) => {

  return (
    <div className={'flex flex-col sm:flex-row gap-4'}>
        <div className={'font-aeonikBold text-[16px] text-center'}>
            {VideoListHeaderTexts.UPLOADED_VIDEOS}
        </div>
        <div className={'flex flex-row gap-1 justify-center items-center'}>
            <YoutubeIcon/>
            <div className={'flex flex-row gap-1'}>
                <p className={'font-aeonik text-sm text-[#6F706D]'}>{countOfVideo}</p>
                <div className={'font-aeonik text-sm text-[#6F706D]'}>
                    {VideoListHeaderTexts.VIDEOS_COUNT}
                </div>
                <div className={'font-aeonik text-sm text-[#6F706D]'}>
                    ({VideoListHeaderTexts.TOTAL_VIDEOS}
                </div>
                <p className={'font-aeonik text-sm text-[#6F706D]'}>{videoTotalHoursformatted})</p>
            </div>
        </div>
    </div>
  );
};

export default IndexVideoListHeaderLeft