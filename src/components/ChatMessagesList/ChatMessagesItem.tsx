import React from 'react'
import { ChatCompareResults } from '../../constants'
import { type QuestionMessage } from '../../types/messageTypes'

import { ReactComponent as UserIcon } from '../../icons/user.svg'
import { ReactComponent as AIIcon } from '../../icons/ai.svg'

interface ChatMessagesItemProps {
  message: QuestionMessage
  index: number
  handleClick: (event: React.MouseEvent<HTMLSpanElement>) => void
  handleShow: (index: number | undefined, question: string) => void
  key: number
}

const ChatMessagesItem: React.FC<ChatMessagesItemProps> = ({ message, index, handleClick, handleShow }) => {
  return (
    <>
        <div className={'flex flex-column gap-1'} key={index}>
          <div key={index} className={`${message.sender === 'user' ? ' mb-[5px] flex-row gap-2 justify-end items-start flex' : 'mt-[5px] flex-row gap-2 justify-start items-start flex'}`}>
            {message.sender === 'user'
              ? <div className={'flex flex-row'}>
                  <div className={`whitespace-pre-line mr-[10px] ml-[5px] ${message.sender === 'user' ? 'userBubble' : 'aiBubble'}`}>
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
          {message.sender !== 'user' ? <div onClick={() => { handleShow(index, message.question as string) }} className={'text-[#006F33] text-sm font-medium pl-[2px] cursor-pointer font-aeonikBold'}>{ChatCompareResults.COMPARE_RESULTS}</div> : ''}
        </div>
    </>
  )
}

export default ChatMessagesItem
