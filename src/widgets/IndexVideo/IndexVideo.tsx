import React from 'react'
import IndexVideoHeader from './IndexVideoHeader'
import { useCommonElement } from './WrapperPage'
import IndexVideoList from '../IndexVideoList/IndexVideoList'

interface IndexVideo {
}

const IndexVideo: React.FC<IndexVideo> = () => {
  const commonElement = useCommonElement()
  return (
      <div>
        {commonElement}
        <IndexVideoHeader/>
        <IndexVideoList/>
      </div>
  )
}

export default IndexVideo
