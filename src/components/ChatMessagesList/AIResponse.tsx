import React, { useEffect, useState } from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
// import ArrowIcon from '../../icons/arrow';
import { ReactComponent as PlayVideo } from '../../icons/PlayVideo.svg';
import ArrowIcon from '../../icons/ArrowIcon';
import { formatTime } from './formatTime';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

interface Message {
  link?: string;
  linkText?: string;
  text?: string;
  toolsData?: {
    end: number;
    start: number;
    thumbnail_url: string | undefined; video_url: string 
} []
}

interface AIResponseProps {
  message: Message;
  handleClick: (event: React.MouseEvent<HTMLSpanElement>) => void;
  handleShow: (index: number | undefined, question: string) => void
}

const AIResponse: React.FC<AIResponseProps> = ({ message, handleClick, handleShow }) => {
  const hasValidMessage = message && message.text;
  const hasValidLink = message && message.link != null && message.linkText != null;
  const [showAllVideos, setShowAllVideos] = useState(false)

  const handleVideoClick = (index: number | undefined) => {
    handleShow(index, "Another quick hitter Devante Adams again")
  };

  const formattedDurations =
    message?.toolsData?.map((video) =>
      formatTime(Math.round(video.start), Math.round(video.end))
    ) || [];

  return (
    <>
      {hasValidMessage && (
        <div className={'relative ml-7'}>
          <div className={'flex flex-row gap-2 items-center'}>
            <div className={'w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
              <AIIcon />
            </div>
            <div className={'font-aeonikBold'}>
                  Jockey
            </div>
          </div>
          <div className={'mr-[5px] aiBubble ml-7 whitespace-pre-line gap-4'}>
              <div>
                {/* Check if toolsData exists and has totalOutput, then render HLS videos */}
                {message?.toolsData && (
                  <div>
                    <ul className={'flex flex-wrap pb-3 gap-2'}>
                      {message.toolsData.slice(0, showAllVideos ? undefined: 3).map((video, index) => {
                        return (
                        <li key={index} className=" ">
                            {/* <div className={'mb-2'}>
                            <button onClick={() => handleDownload(video.video_url)}>
                              Download
                            </button>
                          </div> */}
                          <div className='relative cursor-pointer' onClick={() => handleVideoClick(index)}>
                            <img
                              src={video.thumbnail_url}
                              key={index}
                              className={"rounded p-[0.5px]" + (message?.toolsData && message.toolsData.length <= 1 ? 'w-full h-full' : 'w-[220px] h-[122px]')}
                            />
                            <div className='absolute top-0 left-0 mt-2 ml-2 pr-[10px] pl-[10px] pt-[4px] pb-[4px] w-5 h-5 bg-[#22222299] rounded-2xl flex flex-row justify-center items-center'>
                              <p className='text-[12px] font-aeonik text-[#FFFFFF]'>
                                {index + 1}
                              </p>
                            </div>
                            <div className='opacity-60 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                              <PlayVideo/>
                            </div>
                            <div className='absolute top-0 right-0 pr-[4px] pl-[4px] pt-[2px] pb-[2px] bg-[#22222299] rounded-bl-lg rounded-tr-lg'>
                              <p className='text-[12px] font-aeonik text-[#FFFFFF]'>
                                {formattedDurations[index]}
                              </p>
                            </div>
                          </div>
                        </li>
                    )})}
                    </ul>
                    {message?.toolsData.length > 3 && (
                      <button onClick={() => setShowAllVideos(!showAllVideos)} className={'text-[#006F33] flex flex-row gap-1 justify-center items-center font-aeonik'}>
                        {showAllVideos ? 'Show Less' : `See ${message.toolsData.length - 3} more results`}
                        <ArrowIcon direction={showAllVideos}/>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {hasValidLink && (
              <div>
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIResponse;
