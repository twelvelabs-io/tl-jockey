import React from 'react'

const ChooseVideo = ({ initialStateActive }: { initialStateActive: boolean }): JSX.Element => {
  return (
    <div className="mb-4">
      <div className="border-[#222222] bg-[#222222] bg-opacity-60 w-[40px] h-[40px] border rounded-[64px] relative flex justify-center items-center">
        <div
          className={` border-white bg-white border rounded-[32px] bg-opacity-60 w-[20px] h-[20px] cursor-pointer  ${
            initialStateActive ? 'bg-white bg-transparent' : ' bg-[#222222] bg-opacity-40'
          }`}
        ></div>
      </div>
    </div>
  )
}

export default ChooseVideo
