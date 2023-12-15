import React, { useState } from 'react'
import CustomUpload from '../../icons/CustomUpload'
import { ButtonTexts } from '../../../src/constants'

const UploadVideoButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = (): void => {
    setIsHovered(true)
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
  }
  return (
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={'text-center justify-between flex bg-[#E5E6E4] pt-2 pr-1 pb-2 pl-1 hover:text-[#006F33] group'}>
          <div className={'flex-row gap-[4px] justify-center items-center flex cursor-pointer'}
           >
            <div className={'justify-center items-center w-[16px] h-[16px] flex'}>
                <CustomUpload color={isHovered ? '#006F33' : '#222222'} />
            </div>
            <div
                className={''}>
                  <p className={'text-sm font-medium leading-5 font-aeonikBold '}>{ButtonTexts.UPLOAD_VIDEO}</p>
            </div>
          </div>
      </button>
  )
}

export default UploadVideoButton
