import React from 'react'
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
import { QuestionMessage } from '../../types/messageTypes';

interface AIResponseHeaderProps {
    message: QuestionMessage
}

export const AIResponseHeader:React.FC<AIResponseHeaderProps> = ({message}) => {
    return (
            <div className={'flex flex-row gap-2 items-center'}>
              <div className={'w-7 h-7 flex items-center justify-center border-1 rounded-2xl'}>
                <AIIcon />
              </div>
              <div className={'font-aeonikBold'}>
                    { message?.sender === 'ai' && 'Jockey'  }
              </div>
            </div>
    )
}

export default AIResponseHeader