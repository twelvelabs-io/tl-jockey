import React from 'react'
import ColumnModal from './ColumnModal'

interface ColumnGroupProps {
  columnData: Array<{
    className: string
    modelLogo: string
    modelName: string
    backgroundColor: string
    text: string[]
  }>
}

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
