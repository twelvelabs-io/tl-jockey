import React from 'react'
import { QuestionHeaderProps } from './ModalTypes'

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ logo, text, handleClose }) => (
    <div className={'flex justify-between flex-row items-start pt-[18px] gap-4'}>
      <div className={'text-xl font-bold text-left pb-6 font-aeonik'}>
        {text}
      </div>
      <div onClick={handleClose} className={'cursor-pointer w-8 h-8 flex justify-center items-center'}>
        <img src={logo} alt="logoColumns"/>
      </div>
    </div>
)

export default QuestionHeader
