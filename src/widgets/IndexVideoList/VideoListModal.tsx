// VideoListModal.tsx
import React from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { VideoChooseType } from './IndexVideoList';
import ModalText from './ModalText';
import useDeleteFromList from './hooks/useDeleteFromList';

interface VideoListModalProps {
  open: boolean;
  onClose: () => void;
  cancelVideo: () => void;
  videoNameChoose?: VideoChooseType
  activeVideoName: string | null
}

const VideoListModal: React.FC<VideoListModalProps> = ({ open, onClose, cancelVideo, videoNameChoose, activeVideoName }) => {
  const { deleteVideo, loading, error } = useDeleteFromList()
  const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 470,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  const handleDeleteChosedVideo = async () => {
    if (videoNameChoose) {
      const response = await deleteVideo(String(videoNameChoose.index), videoNameChoose.videoId);
      if (response.success) {
        cancelVideo();
        onClose();
      } else {
        console.error('Failed to delete video:', response.error);
      }
    } else {
      console.error('No video chosen for deletion');
    }
  };

  const handleCloseModal = () => {
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">

          <p className={'text-xl text-[#222222] font-aeonikBold'}>{ModalText.DELETE_MODAL_TITLE} {activeVideoName}</p>
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          <p className={'font-aeonik text-[16px] text-[#6F706D] mb-4'}>
            {ModalText.DELETE_MODAL_CONTENT}
          </p>
        </Typography>
        <div className={'flex flex-row justify-between'}>
          <Button className={'cursor-pointer'} onClick={handleCloseModal}>
            <p className={'font-aeonik text-[16px] text-[#6F706D]'}>{ModalText.CANCEL_BUTTON}</p>
          </Button>
          <div onClick={handleDeleteChosedVideo} className={'bg-red-500 flex flex-row justify-center items-center gap-2 p-2 cursor-pointer'}>
                <p className={'font-aeonik text-[16px] text-white'}>{ModalText.DELETE_BUTTON}</p>
            </div>
        </div>
      </Box>
    </Modal>
  );
};

export default VideoListModal;
