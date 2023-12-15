import React from 'react'
import { ReactComponent as UploadIcon } from '../../icons/upload.svg'
import { ButtonTexts } from '../../../src/constants'

const UploadVideoButton: React.FC = () => {
  return (
      <button className={'text-center justify-between flex bg-[#E5E6E4] pt-2 pr-1 pb-2 pl-1 w-[128px] h-[36px]'}>
          <div className={'flex-row gap-[4px] justify-center items-center flex cursor-pointer'}
           >
            <div className={'justify-center items-center w-[16px] h-[16px] flex'}>
              <UploadIcon />
            </div>
            <div
                className={''}>
                  <p className={'text-sm font-medium leading-5 font-aeonikBold'}>{ButtonTexts.UPLOAD_VIDEO}</p>
            </div>
          </div>
      </button>
  )
}

export default UploadVideoButton
