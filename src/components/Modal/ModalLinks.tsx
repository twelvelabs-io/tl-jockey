/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react'
import { textsModalCentral } from './ModalTypes'
import youtube_logo from '../../icons/youtube_logo.png'

interface ModalLinksProps {
    className: string;
    youtubeLinkForClip: string | false;
}

export const ModalLinks:React.FC<ModalLinksProps> = ({ className, youtubeLinkForClip }) => {
    const handleLinkClick = () => {
        if (youtubeLinkForClip) {
            if (isValidUrl(youtubeLinkForClip)) {
                window.open(youtubeLinkForClip, '_blank');
            } else {
                console.error('Invalid URL');
            }
        }
    };
    return (
        <div 
            className={className}
            onClick={handleLinkClick}>
          <img 
            width={30} 
            height={24} 
            src={youtube_logo} 
            alt="YouTube-Logo"
          />
          <p className="font-aeonikBold text-sm font-[16px]">
            { textsModalCentral.linksForNfl }
          </p>
      </div> 
    )
}   

export default ModalLinks

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}