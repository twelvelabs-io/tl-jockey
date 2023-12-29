import React, { useState } from 'react'
import { Button } from '../../components/SubmitButton/SubmitButton'
import { ReactComponent as UploadIcon } from '../../icons/upload.svg'
import DropZoneModal from '../Dropzone/YoutubeUrlForm/DropZoneModal'

interface IndexVideoHeader {
}

const IndexVideoHeader: React.FC<IndexVideoHeader> = () => {
  const [open, setOpen] = useState(false);
  const handleOpenUploadForm = () => {
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={'p-6 border-b-[1px] border-[#E5E6E4]'}>
      <div className={'flex flex-row justify-end items-end'}>
        <button
            onClick={handleOpenUploadForm}
            className={'btn-primary-submit flex flex-row justify-center gap-2 items-center'}
        >
            <UploadIcon />
            {Button.BUTTON_UPLOAD}
        </button>
      </div>
      <DropZoneModal open={open} onClose={handleClose}/>
    </div>
  )
}

export default IndexVideoHeader
