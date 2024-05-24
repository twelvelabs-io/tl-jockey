import React from "react";
import Modal from "react-bootstrap/esm/Modal";
import Button from "../Button/Button";
import { ActionType, useChat } from "../../widgets/VideoAssistant/hooks/useChat";
import { ButtonTypes } from "../../types/buttonTypes";
import { textsClearModal } from "./ModalTypes";
import helpersFunctions from "../../helpers/helpers";
import ModalClearHeader from "../ModalClear/ModalClearHeader";
import ModalClearBody from "../ModalClear/ModalClearBody";

interface ModalClearProps { 
    showModal: boolean,
    handleClose: () => void;
}

export const ModalClear: React.FC<ModalClearProps> = ({ showModal,handleClose }) => {
    const [ state, dispatch ] = useChat()

    const onClearClick = () => {
       helpersFunctions.closeAndClearModal(dispatch, handleClose)
    }

    return (
      <Modal 
        show={showModal} 
        onHide={handleClose} 
        centered className={'custom-modal-clear '} 
        scrollable 
        >
        <Modal.Body className='w-[470px] h-[190px] flex flex-col justify-between '>
            <ModalClearHeader textHeader={textsClearModal.header} textBody={textsClearModal.body}/>
            <ModalClearBody onClearClick={onClearClick} cancel={ButtonTypes.CANCEL} clear={ButtonTypes.CLEAR} handleClose={handleClose}/>
        </Modal.Body>
    </Modal>
    )
}

export default ModalClear