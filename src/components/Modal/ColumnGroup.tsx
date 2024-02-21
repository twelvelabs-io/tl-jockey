import React from 'react'
import ColumnModal from './ColumnModal'
import { ColumnGroupProps } from './ModalTypes'

const ColumnGroup: React.FC<ColumnGroupProps> = ({ columnData }) => {
  return (
    <div className="row">
          {columnData.map((column, index) => {
            const {
              className,
              modelLogo,
              modelName,
              backgroundColor,
              text
            } = column
            return (
              <ColumnModal
                key={index}
                className={className}
                modelLogo={modelLogo}
                modelName={modelName}
                backgroundColor={backgroundColor}
                text={text}
              />
            )
          })}
    </div>
  )
}

export default ColumnGroup
