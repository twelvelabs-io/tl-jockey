/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';
import { ReactComponent as UserIcon } from '../../icons/user.svg';
import { State } from '../../widgets/VideoAssistant/hooks/useChatTypes';
const UserResponse: React.FC<{ message: string, isUserMessage: boolean, chatState: State }> = ({ message, isUserMessage, chatState }) => {
    const { statusMessages, loading, arrayMessages } = chatState

    const lastElement = arrayMessages[arrayMessages.length - 2]?.text === message
    return (
    <div className={'ml-7'}>
        <div className={'flex flex-row gap-2 items-center'}>
             <div className={'w-7 h-7 bg-[#EDF6F1] rounded-2xl flex items-center justify-center'}>
                <UserIcon/>
              </div>
              <div className={'font-aeonikBold'}>
                You
              </div>
        </div>
        <div className={`ml-7 whitespace-pre-line mr-[10px] ${isUserMessage ? 'userBubble' : 'aiBubble'}`}>
               {message}
         </div>
         <div className={`flex flex-row gap-2 items-center mt-3 `}>
              {/* <div className={"dot-pulse w-7 h-7 mr-5"}>
                <div className={'stage'}>
                  <div className="dot-pulse"></div>
                </div>
              </div>
              <p className={'text-[#6F706D] font-aeonik text-[12px]'}>
                "hello how are tyou"
              </p> */}
            { lastElement && loading &&
              <div className="dot-pulse w-7 h-7 mr-5">
                <div className={'stage'}>
                  <div className="dot-pulse"></div>
                </div>
              </div>
            }
            { lastElement && statusMessages.map((statusMessage, index) => (
              <p key={index} className={'text-[#6F706D] font-aeonik text-[12px]'}>
                {statusMessage}
              </p>
            ))}
         </div>
      </div>)
};

export default UserResponse;