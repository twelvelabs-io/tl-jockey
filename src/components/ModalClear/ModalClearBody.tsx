import React from 'react'
import Button from "../Button/Button";

interface ModalClearBodyProps {
    handleClose: () => void,
    cancel: string,
    clear: string,
    onClearClick: () => void
}

export const ModalClearBody:React.FC<ModalClearBodyProps> = ({ handleClose, cancel, clear, onClearClick }) => {
    return (
        <div className="flex justify-between flex-row items-center pt-3">
            <div className={''} onClick={() => handleClose()}>
                <Button className={'clear-button'}>
                    <p className={'font-aeonik text-[#6F706D] text-sm'}>
                        {
                            cancel
                        }
                    </p>
                </Button>
            </div>
            <div className={''} onClick={onClearClick}>
                <Button className={'error-button'}>
                    <p className={'font-aeonik text-[#FFFFFF] text-sm'}>
                        {
                            clear 
                        }
                    </p>
                </Button>
            </div>
        </div>
    )
}

export default ModalClearBody