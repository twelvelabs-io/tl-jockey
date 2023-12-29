// VideoListModal.tsx
import React from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { ReactComponent as DeleteIcon } from '../../icons/delete.svg'

interface VideoListModalProps {
  open: boolean;
  onClose: () => void;
  cancelVideo: () => void;
  videoNameMap: Record<string, number>
  activeVideoName: string | null
}

const VideoListModal: React.FC<VideoListModalProps> = ({ open, onClose, cancelVideo, videoNameMap, activeVideoName }) => {
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

  const handleDeleteChosedVideo = () => {
    cancelVideo()
    onClose()
  }

  const handleCloseModal = () => {
    onClose()
  }

  console.log(videoNameMap)

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">

          <p className={'text-xl text-[#222222] font-aeonikBold'}>Delete {activeVideoName}</p>
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          <p className={'font-aeonik text-[16px] text-[#6F706D] mb-4'}>
            Video data will be removed from the database permanently. To make the video searchable again, you
            will have to re-upload the video to the playground.
          </p>
        </Typography>
        <div className={'flex flex-row justify-between'}>
          <Button className={'cursor-pointer'} onClick={handleCloseModal}>
            <p className={'font-aeonik text-[16px] text-[#6F706D]'}>Cancel</p>
          </Button>
          <div onClick={handleDeleteChosedVideo} className={'bg-red-500 flex flex-row justify-center items-center gap-2 p-2 cursor-pointer'}>
                <p className={'font-aeonik text-[16px] text-white'}>Delete permanently</p>
            </div>
        </div>
      </Box>
    </Modal>
  );
};

export default VideoListModal;
