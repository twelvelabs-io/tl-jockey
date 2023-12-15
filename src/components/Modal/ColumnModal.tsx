import React from 'react'
import HeaderModal from './HeaderModal'

interface ColumnModalProps {
  modelLogo: string
  modelName: string
  backgroundColor: string
  text?: string[]
  className: string
}

const ColumnModal: React.FC<ColumnModalProps> = ({ className, modelLogo, modelName, backgroundColor, text }) => {
  console.log(text)
  return (
  <div className={`${className} ${backgroundColor} border-[0.5px] border-solid border-[#e5e5e5] `}>
    {/* Header for the Column */}
    <HeaderModal modelLogo={modelLogo} modelName={modelName} backgroundColor={backgroundColor}/>

    {/* Text for the Column */}
    <div className={`row ${backgroundColor} text-left pt-3 pb-3`}>
        <div className="col">
            <p className={'whitespace-pre-line font-aeonik font-normal text-[16px]'}>{text}</p>
        </div>
    </div>
  </div>
  )
}

export default ColumnModal
