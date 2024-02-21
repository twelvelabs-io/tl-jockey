import React from 'react'
import logo from '../../../src/icons/logo.svg'

import Modal from 'react-bootstrap/Modal'
import asr from '../../../src/icons/asr.svg'
import lama from '../../../src/icons/lama.svg'
import union from '../../../src/icons/union.svg'

import { ModelNames } from '../../constants'
import QuestionHeader from './QuestionHeader'
import ColumnGroup from './ColumnGroup'
import { type State } from '../../widgets/VideoAssistant/hooks/useChatTypes'

interface ModalCentralProps {
  chatState: State
  chatDispatch: React.Dispatch<any>
  handleClose: () => void
  choosedElement: number | undefined
  autofillApi: boolean
}

const ModalCentral: React.FC<ModalCentralProps> = ({
  chatState,
  chatDispatch,
  handleClose,
  choosedElement,
  autofillApi
}) => {
  const adjastableColumns: string = autofillApi ? 'col-md-4' : 'col-md-6'

  const arrayMessages = chatState.arrayMessages
  const showModal = chatState.showModal

  const columnData = [
    {
      className: adjastableColumns,
      modelLogo: logo,
      modelName: ModelNames.MODEL_TWELVE_LABS,
      backgroundColor: 'bg-[#F7FEF2]',
      text: arrayMessages.map((element, index) =>
        index === choosedElement ? element.twelveText as string : ''
      )
    },
    {
      className: adjastableColumns,
      modelLogo: asr,
      modelName: ModelNames.MODEL_ASR_AND_GPT,
      backgroundColor: 'bg-[#F9FAF9]',
      text: arrayMessages.map((element, index) =>
        index === choosedElement ? element.asrTest as string : ''
      )
    },
    ...(autofillApi
      ? [
          {
            className: 'col-md-4',
            modelLogo: lama,
            modelName: ModelNames.MODEL_LAMA,
            backgroundColor: 'bg-[#F9FAF9]',
            text: arrayMessages.map(
              (element, index) =>
                index === choosedElement ? element.lameText as string : ''
            )
          }
        ]
      : [])
  ]

  return (
    <Modal show={showModal} onHide={handleClose} centered className={'custom-modal'} scrollable >
      <div className={`${!autofillApi ? 'block' : ''}`}>
        <QuestionHeader
            handleClose={handleClose}
            logo={union}
            text={arrayMessages.map((element, index) => index === choosedElement ? element.question as string : '')}
        />
        </div>
    <Modal.Body>
    <div className={`pb-3 pl-6 pr-6 block ${!autofillApi ? 'items-center' : ''} ${!autofillApi ? 'justify-center' : ''}`}>
      <ColumnGroup columnData={columnData} />
    </div>
    </Modal.Body>
  </Modal>
  )
}

export default ModalCentral
