import React from 'react'
import { SubmitButtonProps, ButtonText } from './SubmitButtonTypes'
import  CustomSubmitArrow from '../../icons/ArrowSubmit';
const SubmitButton: React.FC<SubmitButtonProps> = ({
  submitButtonRef,
  setAutofillApi,
  handleChatApi,
  value
}) => {
  return (
    <div className={'flex justify-end'}>
      <div className={'flex flex-row justify-center items-center'}>
          <button
            disabled={!value}
            onClick={() => {
              setAutofillApi(false)
              handleChatApi()
            }}
            ref={submitButtonRef}
            className={'absolute mr-12'}
          >
            {value !== '' ? <CustomSubmitArrow color={'#9AED59'} colorText={'black'}/> : <CustomSubmitArrow color={'#B7B9B4'} colorText={'#fff'}/>}
          </button>
      </div>
    </div>
  )
}

export default SubmitButton
