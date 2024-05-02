import React from 'react'
import { ReactComponent as AIIcon } from '../../icons/ai.svg';

export const AIResponseFallback = ({}) => {
    return (
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
            <p className={'font-aeonikBold text-red-600'}>
                AI Message Retrieval Failed...
            </p>
        </div>
      </div>
    )
}

export default AIResponseFallback