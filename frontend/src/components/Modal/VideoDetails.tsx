import { ModalType, PanelVideos } from '../../types/messageTypes';

interface VideoDetailsProps {
  modalType: ModalType;
  chosenIndex: string | number | undefined
  panelVideosList: PanelVideos[];
  arrayMessages: any[];
}

const getVideoDetails = ({
  modalType,
  chosenIndex,
  panelVideosList,
  arrayMessages,
}: VideoDetailsProps) => {
  const videoUrl = modalType === ModalType.MESSAGES
    ? arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as string]?.video_url
    : panelVideosList?.[chosenIndex as number]?.hls?.video_url;

  const textForModal = modalType === ModalType.MESSAGES
    ? arrayMessages
      .flatMap((message) => 
        message?.toolsData?.[chosenIndex as string]?.metadata?.map((meta: { type: string; text: any; }) => 
          meta?.type === 'conversation' ? meta?.text : null
        )
      )
      .filter((text) => text !== null)
      .join('\n')
    : panelVideosList?.[chosenIndex as number]?.metadata?.filename;

  const confidenceScore = modalType === ModalType.MESSAGES
    ? arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as number]?.score
    : undefined;

  const confidenceName = modalType === ModalType.MESSAGES
    ? arrayMessages?.[arrayMessages.length - 1]?.toolsData?.[chosenIndex as number]?.confidence
    : undefined;

    console.log(panelVideosList)

  return {
    videoUrl,
    textForModal,
    confidenceScore,
    confidenceName,
  };
};

export default getVideoDetails;
