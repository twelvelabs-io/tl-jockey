/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useEffect, useRef, useState } from 'react'
import ChatMessagesItem from './ChatMessagesItem'
import { ChatMessagesListProps } from './ChatMessagesListTypes'
import { ErrorBoundary } from 'react-error-boundary'

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({arrayMessages, handleShow}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [arrayMessages]);

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh or try again later.</div>}>
      <div ref={chatContainerRef} className={'flex flex-col gap-[20px] overflow-y-auto max-h-50vh pb-[80px]w-[680px]'}>
        { arrayMessages?.map((message, index) => (
            <ChatMessagesItem
              message={message}
              index={index}
              handleShow={handleShow}
              key={index}/>
              
        ))}
      </div>
    </ErrorBoundary>
  )
}

export default ChatMessagesList
