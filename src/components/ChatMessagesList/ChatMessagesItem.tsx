import React from 'react'
import { ChatMessagesItemProps } from './ChatMessagesItemTypes'
import UserResponse from './UserResponse';
import AIResponse from './AIResponse';

const ChatMessagesItem: React.FC<ChatMessagesItemProps> = ({ message, index, handleClick, handleShow, chatState }) => {
  const isUserMessage = message.sender === 'user'
  
  return (
        <div className={'flex flex-col'} key={index}>
          <div key={index} className={`${isUserMessage ? ' flex-row gap-2 justify-start items-start flex' : 'flex-row gap-2 justify-start items-start flex'}`}>
            {isUserMessage 
              ? <UserResponse message={message.text} isUserMessage={isUserMessage} chatState={chatState}/>
              : <AIResponse message={message} handleClick={handleClick} handleShow={handleShow}/>
            }
          </div>
        </div>
  )
}

export default ChatMessagesItem
