import React from 'react'
import { ReactComponent as RefreshIcon } from '../../icons/refresh.svg'
import { HeaderTexts } from '../../../src/constants'
import Button from '../../components/Button/Button'

interface StartNewGroupProps {
  clearChat: () => void
}

const StartNewGroup: React.FC<StartNewGroupProps> = ({ clearChat }) => {
  return (
      <div className={'text-center justify-between flex'}>
          <div 
            className={'flex-row gap-[4px] justify-center items-center flex cursor-pointer'}
            onClick={clearChat}
          >
            <div className={'justify-center items-center w-[16px] h-[16px] flex'}>
              <RefreshIcon />
            </div>
            <Button className="btn-primary-new">
              <p>{HeaderTexts.START_NEW_CHAT}</p>
            </Button>
          </div>
      </div>
  )
}

export default StartNewGroup
