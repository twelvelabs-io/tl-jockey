import React from 'react'
import { useCommonElement } from './WrapperPage'

interface IndexVideo {
}

const IndexVideo: React.FC<IndexVideo> = () => {
  const commonElement = useCommonElement()
  return (
      <div>
        {commonElement}
      </div>
  )
}

export default IndexVideo
