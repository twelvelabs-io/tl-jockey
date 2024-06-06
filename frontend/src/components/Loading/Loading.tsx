import React from 'react'

const Loading = (): JSX.Element => {
  return (
    <div className="dot-pulse w-7 h-7 mr-5">
      <div className={'stage'}>
        <div className="dot-pulse"></div>
      </div>
  </div>
  )
}

export default Loading
