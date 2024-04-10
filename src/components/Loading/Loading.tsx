import React from 'react'

const Loading = (): JSX.Element => {
  return (
    <div className="flex flex-row items-start justify-start w-full">
      <div className="bouncing-loader mb-2 ml-7">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}

export default Loading
