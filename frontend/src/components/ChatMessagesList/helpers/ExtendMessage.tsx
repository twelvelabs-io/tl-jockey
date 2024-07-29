import React, { useState } from 'react'
import ArrowIcon from '../../../icons/ArrowIcon';

interface ExtendMessageProps {
    agent: string | undefined;
    message: string | undefined
}

export const ExtendMessage: React.FC<ExtendMessageProps> = ({agent, message}) => {
    const [showMessage, setShowMessage] = useState(false);
    return (
        <div className={'flex flex-col gap-2 justify-center items-start'}>
            {
                Boolean(agent) && Boolean(message) && 
                    <button 
                            onClick={() => setShowMessage(!showMessage)} 
                            className={'text-[#006F33] flex flex-row gap-1 justify-center items-center font-aeonik cursor-pointer'}
                            >
                                {agent}
                        <ArrowIcon direction={showMessage}/>
                    </button>
            }
            {   showMessage && (
                <div className="div">
                    {message}
                </div>
            )}
        </div>
    );
}

export default ExtendMessage
