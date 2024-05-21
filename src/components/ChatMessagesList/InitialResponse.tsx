/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';
import { ReactComponent as AIIcon } from '../../icons/ai.svg';
import AutofillQuestions from '../AutofillQuestions/AutofillQuestions';
import { Link } from 'react-router-dom';
import { autofillQuestions } from '../AutofillQuestions/AutofillQuestionsTypes';

enum initialTexts {
    Headline = "Hi, I'm Jockey",
    Body = "Here are some things I can do:"
}

const InitialResponse: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className={'ml-[40px] pt-[95px] max-w-[672px]'}>
            <Link to="/Chat">
                <div className={'flex flex-row gap-2 items-center'}>
                    <div className={'h-10 flex items-center justify-center border-1 rounded-full'}>
                        <AIIcon />
                    </div>
                </div>
            </Link>
        <div className={'font-aeonikBold text-[45px] font-bold text-[#333431] pb-[20px]'}>
            { initialTexts.Headline }
        </div>
        <div className={`whitespace-pre-line pb-[12px] font-aeonik`}>
               { message }
        </div>
        <div className={`whitespace-pre-line pb-[12px] font-aeonik`}>
               { initialTexts.Body }
        </div>
        <AutofillQuestions 
            autofillQuestions={autofillQuestions}
        />
      </div>
      )
};

export default InitialResponse