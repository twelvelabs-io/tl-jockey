import React, { useEffect, useState } from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
// import ArrowIcon from '../../icons/arrow';
import ReactHlsPlayer from 'react-hls-player';
import ArrowIcon from '../../icons/ArrowIcon';
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

interface Message {
  link?: string;
  linkText?: string;
  text?: string;
  toolsData?: {
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

  return (
    <>
      {hasValidMessage && (
        <div className={'relative'}>
          <div className={'flex flex-row gap-2 items-center'}>
            <div className={'w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
              <AIIcon />
            </div>
            <div className={'font-aeonikBold'}>
                  Jockey
            </div>
          </div>
          <div className={'mr-[5px] aiBubble ml-7 whitespace-pre-line'}>
              <div>
                {/* Check if toolsData exists and has totalOutput, then render HLS videos */}
                {message?.toolsData && (
                  <div>
                    <ul className={'flex flex-wrap pb-3 gap-1'}>
                      {message.toolsData.slice(0, showAllVideos ? undefined: 3).map((video, index) => (
                        <li key={index} className="w-1/4 p-1">
                            {/* <div className={'mb-2'}>
                            <button onClick={() => handleDownload(video.video_url)}>
                              Download
                            </button>
                          </div> */}
                          <img
                            src={video.thumbnail_url}
                            key={index}
                            height="auto"
                            className={'rounded'}
                            onClick={() => handleVideoClick(index)}
                          />
                        </li>
                      ))}
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
