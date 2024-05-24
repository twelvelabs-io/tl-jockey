import React from 'react'
import { textsClearModal } from '../Modal/ModalTypes'
import Modal from "react-bootstrap/esm/Modal";

interface ModalClearHeaderProps {
    textHeader: string,
    textBody: string
}

export const ModalClearHeader: React.FC<ModalClearHeaderProps> = ({ textHeader, textBody }) => {
    return (
        <div>
            <Modal.Title id="example-modal-sizes-title-sm">
                <p className={'text-[#222222] text-[20px] font-aeonikBold font-bold flex flex-start'}>
                    { textHeader }
                </p>
            </Modal.Title>
            <p className="flex flex-start pt-4 text-[#6F706D] font-aeonik text-[16px]">
                { textBody }
            </p>
        </div>
    )
}

export default ModalClearHeader