import React from 'react'
import { ReactComponent as CheckCircle } from '../../icons/CheckCircle.svg'
import { ReactComponent as CheckCircleIcon } from '../../icons/CheckCircleIcon.svg'

const ChooseVideo = ({ initialStateActive }: { initialStateActive: boolean }): JSX.Element => {
  return (
    <div className="mb-4">
      <div className="border-[#222222] bg-[#222222] bg-opacity-60 w-[40px] h-[40px] border rounded-[64px] relative flex justify-center items-center">
        <div
          className={` border-white border rounded-[32px] bg-opacity-60 w-[20px] h-[20px] cursor-pointer flex justify-center items-center  ${
            initialStateActive ? '' : ' bg-opacity-40 bg-[#222222]'
          }`}
        >
          {initialStateActive && 
            <div className={'bg-[#222222] bg-gradient-to-r from-#222222 bg-opacity-60 w-[20px] h-[20px] flex justify-center items-center rounded-2xl'}>
            <CheckCircleIcon  />
          </div>}
        </div>
      </div>
    </div>
  )
}


export default ChooseVideo
