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
import ModalClear from './ModalClear'
import StartNewGroup from '../../widgets/VideoAssistant/StartNewGroup'
import helpersFunctions from '../../helpers/helpers'
import useVideoElementEffect from './hooks/useVideoElementEffect'

const ModalCentral: React.FC<ModalCentralProps> = ({
  handleClose,
}) => {
  const [ state, dispatch ] = useChat()
  const { autofill, modalType, panelVideosList, arrayMessages, showModal } = state;
  const { choosedElement } = autofill;
  const [chosenIndex, setChosenIndex] = useState<number | string | undefined>(choosedElement[1])
  const [loading, setLoading] = useState(false);

  const findElementById = (array: any[], id: string | number | undefined) => {
    return array?.find(item => item._id === id);
  };
  
  let arrayOfChoosedElements = arrayMessages?.[choosedElement[0]]?.toolsData

  let fallbackImage = modalType === ModalType.MESSAGES ? 
arrayOfChoosedElements?.[chosenIndex as number]?.thumbnail_url as string :
  findElementById(panelVideosList, chosenIndex)?.hls.thumbnails_urls[0]

  let totalIndexes = modalType === ModalType.MESSAGES ? arrayOfChoosedElements?.length as number : panelVideosList.length
  const videoRef = useRef<HTMLVideoElement>(null)
  let videoUrl = modalType === ModalType.MESSAGES ? 
    arrayOfChoosedElements?.[chosenIndex as number]?.video_url as string : 
    findElementById(panelVideosList, chosenIndex)?.hls.video_url

  let textForModal = modalType === ModalType.MESSAGES ?arrayOfChoosedElements?.[chosenIndex as number]?.video_title : findElementById(panelVideosList, chosenIndex)?.metadata.filename

  useEffect(() => {
    setChosenIndex(choosedElement[1]);
  }, [choosedElement]);

  if (modalType === ModalType.CLEAR_CHAT) {
    return (
      <ModalClear 
        showModal={showModal} 
        handleClose={handleClose}
      />
    )
  }

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

  const clearChat = () => {
    helpersFunctions.openClearModal(dispatch)
  }

  const startTime: number = ModalType.MESSAGES ? arrayOfChoosedElements?.[chosenIndex as number]?.start || 0 : 0
  const endTime: number = ModalType.MESSAGES ? arrayOfChoosedElements?.[chosenIndex as number]?.end || 0 : 0

  useVideoElementEffect({videoRef, startTime, endTime, videoUrl, showModal})

  return (
    <Modal size="lg" show={showModal} onHide={handleClose} centered scrollable>
    <Modal.Body className={'p-[24px]'}>
      <div className={'flex flex-col'}>
          <div>
            <QuestionHeader
                handleClose={handleClose}
                logo={union}
                text={textForModal}
            />
          </div>
          <div>
            <ReactHlsPlayer
              poster={fallbackImage}
              src={videoUrl}
              width={'854px'}
              controls={true}
              height="520px"
              playerRef={videoRef}
              className={'rounded'}
            />
          </div>
        </div>
        <div className="flex justify-between items-center flex-row mt-4">
          <StartNewGroup clearChat={clearChat} colorOfIcon='#B7B9B4' width='14' height='18'/>
          {totalIndexes > 1 && 
            <Pagination 
              chosenIndex={chosenIndex as number} 
              totalIndexes={totalIndexes} 
              handlePageChange={handlePageChange}
            />
          }
        </div>
    </Modal.Body>
  </Modal>
  )
}

export default ModalCentral

