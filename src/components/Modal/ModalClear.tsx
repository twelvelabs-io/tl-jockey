import React from "react";
import Modal from "react-bootstrap/esm/Modal";
import Button from "../Button/Button";
import { ActionType, useChat } from "../../widgets/VideoAssistant/hooks/useChat";
import { ButtonTypes } from "../../types/buttonTypes";
import { textsClearModal } from "./ModalTypes";

interface ModalClearProps { 
    showModal: boolean,
    handleClose: () => void;
}

export const ModalClear: React.FC<ModalClearProps> = ({showModal,handleClose}) => {
    const [ state, dispatch ] = useChat()

    const onClearClick = () => {
        dispatch({ type: ActionType.SET_LOADING, payload: false })
        dispatch({ type: ActionType.SET_INPUT_BOX, payload: '' })
        dispatch({
            type: ActionType.SET_ARRAY_MESSAGES_CLEAN,
            payload: []
        })
        handleClose()
    }

    return (
      <Modal 
        show={showModal} 
        onHide={handleClose} 
        centered className={'custom-modal-clear '} 
        scrollable 
        >
        <Modal.Body className='w-[470px] h-[190px] flex flex-col justify-between '>
            <div>
                <Modal.Title id="example-modal-sizes-title-sm">
                    <p className={'text-[#222222] text-[20px] font-aeonikBold font-bold flex flex-start'}>
                        { textsClearModal.header }
                    </p>
                </Modal.Title>
                <p className="flex flex-start pt-4 text-[#6F706D] font-aeonik text-[16px]">
                    { textsClearModal.body }
                </p>
            </div>
            <div className="flex justify-between flex-row items-center pt-3">
                <div className={''} onClick={() => handleClose()}>
                    <Button className={'clear-button'}>
                        <p className={'font-aeonik text-[#6F706D] text-sm'}>
                            {
                                ButtonTypes.CANCEL
                            }
                        </p>
                    </Button>
                </div>
                <div className={''} onClick={onClearClick}>
                    <Button className={'error-button'}>
                        <p className={'font-aeonik text-[#FFFFFF] text-sm'}>
                            {
                                ButtonTypes.CLEAR
                            }
                        </p>
                    </Button>
                </div>
            </div>
        </Modal.Body>
    </Modal>
    )
}

export default ModalClear