import React, { useState } from 'react'
import { Button } from '../../components/SubmitButton/SubmitButton'
import { ReactComponent as UploadIcon } from '../../icons/upload.svg'
import DropZoneModal from '../Dropzone/YoutubeUrlForm/DropZoneModal'

interface IndexVideoHeader {
}

export enum IndexVideoHeaderTexts {
  UPLOAD_VIDEOS= "Upload Videos",
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
      <div className={'flex flex-row justify-between center'}>
        <div className={'flex items-center justify-center'}>
          <p className={'text-2xl text-[#222222] font-dentonBold'}>{IndexVideoHeaderTexts.UPLOAD_VIDEOS}</p>
        </div>
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
