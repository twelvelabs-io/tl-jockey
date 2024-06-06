import React from 'react'
import DeleteIcon from '../../icons/DeleteIcon'
import Button from '../../components/Button/Button'

interface StartNewGroupProps {
  clearChat: () => void,
  text?: string,
  colorOfIcon: string,
  width: string,
  height: string
}

const StartNewGroup: React.FC<StartNewGroupProps> = ({ clearChat, text, colorOfIcon, width, height }) => {
  return (
      <div className={'text-center justify-end flex pr-[20px] pt-[20px]'}>
          <div 
            tabIndex={0}
            className={'flex-row gap-[4px] justify-center items-center flex cursor-pointer focus:border-2 p-1 focus:border-[#9AED59] focus:outline-none'}
            onClick={clearChat}
          >
            <div className={'justify-center items-center w-[16px] h-[16px] flex'}>
              <DeleteIcon colorOfIcon={colorOfIcon} width={width} height ={height}/>
            </div>
            <Button className={'text-[#929490] font-aeonik'}>
              <p>
                {
                  text
                }
              </p>
            </Button>
          </div>
      </div>
  )
}

export default StartNewGroup
