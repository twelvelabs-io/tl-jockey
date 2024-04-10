import React from 'react'
import { ReactComponent as DeleteIcon} from '../../icons/DeleteIcon.svg'
import { DeleteButtonText } from '../../../src/constants'
import Button from '../../components/Button/Button'

interface StartNewGroupProps {
  clearChat: () => void
}

const StartNewGroup: React.FC<StartNewGroupProps> = ({ clearChat }) => {
  return (
      <div className={'text-center justify-end flex'}>
          <div 
            tabIndex={0}
            className={'flex-row gap-[4px] justify-center items-center flex cursor-pointer focus:border-2 p-1 border-[#9AED59] focus:outline-none'}
            onClick={clearChat}
          >
            <div className={'justify-center items-center w-[16px] h-[16px] flex'}>
              <DeleteIcon />
            </div>
            <Button className={'text-[#929490] font-aeonik'}>
              <p>{DeleteButtonText.CLEAR_CHAT}</p>
            </Button>
          </div>
      </div>
  )
}

export default StartNewGroup
