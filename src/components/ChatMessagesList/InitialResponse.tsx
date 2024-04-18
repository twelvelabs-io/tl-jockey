/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';
import { State } from '../../widgets/VideoAssistant/hooks/useChatTypes';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
import AutofillQuestions from '../AutofillQuestions/AutofillQuestions';
import useAutofillQuestions from '../../widgets/VideoAssistant/hooks/useAutofillQuestions';
import { Link } from 'react-router-dom';
import { autofillQuestions } from '../AutofillQuestions/AutofillQuestionsTypes';

enum initialTexts {
    Headline = "Hi, I'm Jockey",
    Body = "Here are some things I can do:"
}

const InitialResponse: React.FC<{ message: string, chatState: State, chatDispatch: React.Dispatch<any> }> = ({ message, chatDispatch, chatState }) => {
    const { actionsAutofillQuestions } = useAutofillQuestions()

    const {
        setShowAutofillQuestions
      } = actionsAutofillQuestions

    return (
        <div className={'ml-7'}>
            <Link to="/Chat">
                <div className={'flex flex-row gap-2 items-center'}>
                    <div className={'w-10 h-10 flex items-center justify-center border-1 rounded-full'}>
                        <AIIcon />
                    </div>
                </div>
          </Link>
        <div className={'font-aeonikBold text-[45px] font-bold text-[#333431] pb-4'}>
            { initialTexts.Headline }
        </div>
        <div className={`whitespace-pre-line mr-[10px] max-w-[1060px] pb-3`}>
               { message }
        </div>
        <div className={`whitespace-pre-line mr-[10px] max-w-[1060px] pb-3`}>
               { initialTexts.Body }
        </div>
        <AutofillQuestions 
            chatDispatch={chatDispatch} 
            setShowAutofillQuestions={setShowAutofillQuestions}  
            autofillQuestions={autofillQuestions}
        />
      </div>
      )
};

export default InitialResponse