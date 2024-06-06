import React from 'react'
import { HeaderModalProps } from './ModalTypes'

const HeaderModal: React.FC<HeaderModalProps> = ({ modelLogo, modelName, backgroundColor }) => (
    <div className={`row border-b-[0.5px] border-solid border-[#e5e5e5] ${backgroundColor} text-left`}>
    <div className={'col text-[16px] font-semibold flex flex-row gap-1 items-center p-3 h-12'}>
      <div className={'absolute border border-solid border-gray-500 rounded-2xl w-7 h-7 flex justify-center items-center bg-white'}>
        <img src={modelLogo} alt={`${modelName} Logo`} className={'w-4 h-4'}/>
      </div>
      <div className={'pl-8 font-aeonikBold text-[16px] font-medium whitespace-nowrap truncate'}>{modelName}</div>
    </div>
  </div>
)

export default HeaderModal
