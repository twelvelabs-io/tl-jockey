import React, { useRef } from 'react'

import Modal from 'react-bootstrap/Modal'
import union from '../../../src/icons/union.svg'

import QuestionHeader from './QuestionHeader'
import { ModalCentralProps } from './ModalTypes'
import ReactHlsPlayer from 'react-hls-player/dist'

const ModalCentral: React.FC<ModalCentralProps> = ({
  chatState,
  chatDispatch,
  handleClose,
  choosedElement,
  autofillApi
}) => {
  const { arrayMessages, showModal } = chatState
  console.log(choosedElement)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[choosedElement as number]?.video_url as string
  const textForModal = arrayMessages
  ?.map(message =>
    message?.toolsData?.[choosedElement as number]?.metadata?.map(meta =>
      meta?.type === 'conversation' ? meta?.text : null
    )
  )
  .flat() // Flatten the array of arrays into a single array
  .filter(text => text !== null)
  .join('\n');
  const confidenceScore = arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[choosedElement as number]?.score ?? ''
  const confidenceName = arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[choosedElement as number]?.confidence ?? ''
  const renderConfidence = (score: number) => {
    let confidenceText = '';
    let confidenceColor = '';

    if (score < 75) {
      confidenceText = 'Low';
      confidenceColor = '#929490';
    } else if (score >= 75 && score < 85) {
      confidenceText = 'Medium';
      confidenceColor = '#FDC14E';
    } else {
      confidenceText = 'High';
      confidenceColor = '#2EC29F';
    }

    return (
      <div style={{ color: confidenceColor }} className={`flex flex-row gap-2 justify-center items-center`}>
        <p className={'font-aeonikBold'}>
          {confidenceName} 
        </p>
        <div style={{ color: confidenceColor }} className={`p`}>
           <p className={`p-1  font-aeonikBold text-white rounded-md`} style={{ backgroundColor: confidenceColor }}>
              {confidenceScore}
           </p>
        </div>
      </div>
    );
  };
  return (
    <Modal show={showModal} onHide={handleClose} centered className={'custom-modal '} scrollable >
    <Modal.Body>
    <div className={'flex flex-col justify-center items-center'}>
        <div className={`${!autofillApi ? 'block' : ''}`}>
          <QuestionHeader
              handleClose={handleClose}
              logo={union}
              text={textForModal}
          />
        </div>
        <div>
          <div className={'absolute right-0 pr-10 pt-4'}>
            {renderConfidence(confidenceScore as unknown as number)}
          </div>
          <ReactHlsPlayer
            src={videoUrl}
            controls={true}
            height="auto"
            playerRef={videoRef}
            className={'rounded'}
          />
        </div>
      </div>
    </Modal.Body>
  </Modal>
  )
}

export default ModalCentral
