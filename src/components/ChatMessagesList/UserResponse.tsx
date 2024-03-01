import React from 'react';
import { ReactComponent as UserIcon } from '../../icons/user.svg';

const UserResponse: React.FC<{ message: string, isUserMessage: boolean }> = ({ message, isUserMessage }) => (
    <div className={'flex flex-row'}>
        <div className={`whitespace-pre-line mr-[10px] ml-[5px] ${isUserMessage ? 'userBubble' : 'aiBubble'}`}>
               {message}
            </div>
            <div className={'mr-8 relative'}>
              <div className={'absolute w-7 h-7 bg-[#EDF6F1] rounded-2xl flex items-center justify-center'}>
                <UserIcon/>
            </div>
        </div>
      </div>
);

export default UserResponse;