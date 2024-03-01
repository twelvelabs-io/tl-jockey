import React from 'react'
import { ChatCompareResults } from '../../constants'
import { ChatMessagesItemProps } from './ChatMessagesItemTypes'
import UserResponse from './UserResponse';
import AIResponse from './AIResponse';

const ChatMessagesItem: React.FC<ChatMessagesItemProps> = ({ message, index, handleClick, handleShow }) => {
  const isUserMessage = message.sender === 'user'

  const renderCompareResponse = () => (
    <div 
      onClick={() => handleShow(index, message.question as string)} 
      className="text-[#006F33] text-sm font-medium pl-[2px] cursor-pointer font-aeonikBold">
        {ChatCompareResults.COMPARE_RESULTS}
    </div>
  )
  
  return (
        <div className={'flex flex-column gap-1'} key={index}>
          <div key={index} className={`${isUserMessage ? ' mb-[5px] flex-row gap-2 justify-end items-start flex' : 'mt-[5px] flex-row gap-2 justify-start items-start flex'}`}>
            {isUserMessage 
              ? <UserResponse message={message.text} isUserMessage={isUserMessage}/>
              : <AIResponse message={message} handleClick={handleClick}/>
            }
          </div>
          {!isUserMessage && (
            renderCompareResponse()
          )}
        </div>
  )
}

export default ChatMessagesItem
