/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import React, { Suspense } from 'react'
import { ChatMessagesItemProps } from './ChatMessagesItemTypes'
import UserResponse from './UserResponse';
import AIResponse from './AIResponse';
import InitialResponse from './InitialResponse';
import { ErrorBoundary } from 'react-error-boundary';
import Loading from '../Loading/Loading';
import { useChat } from '../../widgets/VideoAssistant/hooks/useChat';

interface ErrorFallBackProps {
  error: Error
}

const ErrorFallback:React.FC<ErrorFallBackProps> = ({ error  }) => (
  <div>
    <p>Something went wrong: {error.message}</p>
  </div>
);

const ChatMessagesItem: React.FC<ChatMessagesItemProps> = ({ message,  index,  handleShow }) => {
  const [state, dispatch] = useChat()
  const { statusMessages, loading, arrayMessages } = state
  const previousMessageText = arrayMessages[arrayMessages.length - 2]?.text;
  const lastElement = previousMessageText === message?.text; 
  if (!message) { 
    return <p>No messages available</p>; 
  }

  const isUserMessage = message.sender === 'user'
  const initialMessage = message.sender === 'initial'

  return (
        <div className={'flex flex-col'} key={index}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<Loading/>}>
              <div key={index} className={`${isUserMessage ? ' flex-row gap-2 justify-start items-start flex' : 'flex-row gap-2 justify-start items-start flex'}`}>
                  {isUserMessage 
                    ? <UserResponse 
                      message={message.text} 
                      isUserMessage={isUserMessage} 
                      statusMessages={statusMessages}
                      loading={loading}
                      lastElement={lastElement}
                      />
                    : (initialMessage ? <InitialResponse message={message.text} /> : <AIResponse message={message} handleShow={handleShow}/>)
                  }
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
  )
}

export default ChatMessagesItem
