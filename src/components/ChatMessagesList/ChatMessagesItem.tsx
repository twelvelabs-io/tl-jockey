import React from 'react'
import { ChatCompareResults } from '../../constants'

import { ReactComponent as UserIcon } from '../../icons/user.svg'
import { ReactComponent as AIIcon } from '../../icons/ai.svg'
import { ChatMessagesItemProps } from './ChatMessagesItemTypes'

const ChatMessagesItem: React.FC<ChatMessagesItemProps> = ({ message, index, handleClick, handleShow }) => {
  const isUserMessage = message.sender === 'user'
  return (
        <div className={'flex flex-column gap-1'} key={index}>
          <div key={index} className={`${isUserMessage ? ' mb-[5px] flex-row gap-2 justify-end items-start flex' : 'mt-[5px] flex-row gap-2 justify-start items-start flex'}`}>
            {isUserMessage 
              ? <div className={'flex flex-row'}>
                  <div className={`whitespace-pre-line mr-[10px] ml-[5px] ${isUserMessage ? 'userBubble' : 'aiBubble'}`}>
                    {message.text}
                  </div>
                  <div className={'mr-8 relative'}>
                    <div className={'absolute w-7 h-7 bg-[#EDF6F1] rounded-2xl flex items-center justify-center'}>
                      <UserIcon/>
                    </div>
                  </div>
                </div>
              : <>
                  <div className={'relative'}>
                    <div className={'absolute w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
                      <AIIcon/>
                    </div>
                  </div>
                  <div className={'mr-[5px] aiBubble ml-8  whitespace-pre-line'}>
                  {(message.link != null && message.link !== undefined && message.link !== '')
                    ? (
                    <div>
                      <span className={'mr-1 '}>{message.linkText}</span>
                      <span className={'text-[#006F33] cursor-pointer border border-solid border-b-[#006F33] mr-1'} onClick={handleClick}>{`${message.link}`}</span>
                        {message.text}
                    </div>
                      )
                    : <div>{message.text}</div>}
                  </div>
                </>
            }
          </div>
          {!isUserMessage && (
            <div 
              onClick={() => handleShow(index, message.question as string)} 
              className="text-[#006F33] text-sm font-medium pl-[2px] cursor-pointer font-aeonikBold">
              {ChatCompareResults.COMPARE_RESULTS}
            </div>
          )}
        </div>
  )
}

export default ChatMessagesItem
