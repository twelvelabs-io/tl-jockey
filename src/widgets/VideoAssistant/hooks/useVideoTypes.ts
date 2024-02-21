import { MutableRefObject, Dispatch, SetStateAction } from 'react';

export interface UseVideoProps {
  videoFiles: string[];
  currentVideoFile: string;
  chatContainerRef: MutableRefObject<HTMLDivElement | null>;
  submitButtonRef: MutableRefObject<HTMLButtonElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
}

export interface UseVideo {
  valuesVideo: UseVideoProps;
  actionsVideo: {
    setVideoFiles: Dispatch<SetStateAction<string[]>>;
    setCurrentVideoFile: Dispatch<SetStateAction<string>>;
  };
}
