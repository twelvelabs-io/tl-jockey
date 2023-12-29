import React from 'react'
import { ReactComponent as EmptyVideoPaceholder } from '../../icons/EmptyVideoPlaceholder.svg'

const EmptyVideoState = (): JSX.Element => {
  return (
    <div className="flex flex-row justify-center items-center w-[332px] h-[208px] bg-[#F7F7FA] rounded-xl border">
      <div className={'absolute top-2 bg-[#222222] opacity-60 rounded pr-2 pl-2 pt-1 pb-1'}>
        <p className={'text-white'}>
          01:03:48
        </p>
      </div>
      <EmptyVideoPaceholder/>
    </div>
  )
}

export default EmptyVideoState
