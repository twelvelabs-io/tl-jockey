import React from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';

const AIResponse: React.FC<{ message: any, handleClick: any }> = ({ message, handleClick }) => (
    <>
    <div className={'relative'}>
      <div className={'absolute w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
        <AIIcon />
      </div>
    </div><div className={'mr-[5px] aiBubble ml-8  whitespace-pre-line'}>
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
);

export default AIResponse;