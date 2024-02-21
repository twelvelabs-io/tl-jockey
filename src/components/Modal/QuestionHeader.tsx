import React from 'react'
import { QuestionHeaderProps } from './ModalTypes'

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ logo, text, handleClose }) => (
    <div className={'flex justify-between flex-row pr-6 items-center pt-[18px]'}>
      <div className={'text-xl font-bold text-left pl-6 font-aeonik'}>
        {text}
      </div>
      <div onClick={handleClose} className={'cursor-pointer'}>
        <img src={logo} alt="logoColumns"/>
      </div>
    </div>
)

export default QuestionHeader
