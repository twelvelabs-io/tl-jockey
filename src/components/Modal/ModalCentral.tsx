/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useEffect, useRef, useState } from 'react'

import Modal from 'react-bootstrap/Modal'
import union from '../../../src/icons/union.svg'

import QuestionHeader from './QuestionHeader'
import { ModalCentralProps } from './ModalTypes'
import ReactHlsPlayer from 'react-hls-player/dist'
import Pagination from '../Pagination/Pagination'
import { ActionType, useChat } from '../../widgets/VideoAssistant/hooks/useChat'
import { ModalType } from '../../types/messageTypes'
import Loading from '../Loading/Loading'
import Button from '../Button/Button'
import ModalClear from './ModalClear'
import StartNewGroup from '../../widgets/VideoAssistant/StartNewGroup'
import { ButtonTypes } from '../../types/buttonTypes'

const ModalCentral: React.FC<ModalCentralProps> = ({
  handleClose,
  autofillApi
}) => {
  const [ state, dispatch ] = useChat()
  const { autofill, modalType, panelVideosList, arrayMessages, showModal } = state;
  const { choosedElement } = autofill;
  const [chosenIndex, setChosenIndex] = useState<number | string | undefined>(choosedElement)
  const [loading, setLoading] = useState(false);


  const findElementById = (array: any[], id: string | number | undefined) => {
    return array?.find(item => item._id === id);
  };

  let arrayOfChoosedElements = arrayMessages?.[arrayMessages.length - 1]?.toolsData

  let fallbackImage = modalType === ModalType.MESSAGES ? 
arrayOfChoosedElements?.[chosenIndex as number]?.thumbnail_url as string :
  findElementById(panelVideosList, chosenIndex)?.hls.thumbnails_urls[0]

  let totalIndexes = modalType === ModalType.MESSAGES ? arrayOfChoosedElements?.length as number : panelVideosList.length
  const videoRef = useRef<HTMLVideoElement>(null)
  let videoUrl = modalType === ModalType.MESSAGES ? 
    arrayOfChoosedElements?.[chosenIndex as number]?.video_url as string : 
    findElementById(panelVideosList, chosenIndex)?.hls.video_url

  let textForModal = modalType === ModalType.MESSAGES ?arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as number]?.video_title : findElementById(panelVideosList, chosenIndex)?.metadata.filename
  let confidenceScore = modalType === ModalType.MESSAGES  ?arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as number]?.score ?? '' : ''
  let confidenceName = modalType === ModalType.MESSAGES  ? arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as number]?.confidence ?? '' : ''

  useEffect(() => {
    setChosenIndex(choosedElement);
  }, [choosedElement]);

  if (modalType === ModalType.CLEAR_CHAT) {
    return (
      <ModalClear 
        showModal={showModal} 
        handleClose={handleClose}
      />
    )
  }

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

  const handlePageChange = (newIndex: number, totalIndexes: number): void => {
    setLoading(true); // Start loading when switching pages
    if (modalType === ModalType.MESSAGES ) {
      const index = newIndex % totalIndexes
      setChosenIndex(index);
    } else {
      const panelItem = panelVideosList[newIndex % totalIndexes];
      console.log(panelItem)
      if (panelItem) {
        const index = panelItem?._id
        setChosenIndex(index)
      }
    }
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const clearChat = (): void => {
    dispatch({
        type: ActionType.SET_MODAL_TYPE,
        payload: ModalType.CLEAR_CHAT,
    });
    dispatch({ type: ActionType.SET_SHOW_MODAL, payload: true });
  }

  console.log(panelVideosList)

  return (
    <Modal show={showModal} onHide={handleClose} centered className={modalType === ModalType.MESSAGES  ?'custom-modal-messages' :'custom-modal'} scrollable >
    <Modal.Body>
    <div className={'flex flex-col'}>
        <div>
          <QuestionHeader
              handleClose={handleClose}
              logo={union}
              text={textForModal}
          />
        </div>
        {loading && <Loading/> }
        <div>
          <ReactHlsPlayer
            poster={fallbackImage}
            src={videoUrl}
            width={'auto'}
            controls={true}
            height="auto"
            playerRef={videoRef}
            className={'rounded'}
          />
        </div>
      </div>
      <div className="flex justify-between items-center flex-row mt-4">
        <StartNewGroup clearChat={clearChat} colorOfIcon='#B7B9B4' width='14' height='18'/>
        <Pagination 
        chosenIndex={chosenIndex as number} 
        totalIndexes={totalIndexes} 
        handlePageChange={handlePageChange}
      />
      </div>
    </Modal.Body>
  </Modal>
  )
}

export default ModalCentral
