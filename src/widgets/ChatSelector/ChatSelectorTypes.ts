import { State } from '../VideoAssistant/hooks/useChatTypes';

export interface ChatSelectProps {
  chatState: State;
  chatDispatch: React.Dispatch<any>;
  showAutofillQuestions: boolean;
  setCurrentVideoFile: (file: string) => void;
  setShowAutofillQuestions: (show: boolean) => void;
  setAutofillApi: (file: boolean) => void;
  setChoosedElement: (file: number | undefined) => void;
  submitButtonRef: React.MutableRefObject<HTMLButtonElement | null>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoFiles: string[];
  currentVideoFile: string;
}

export enum DefaultVideo {
  FILE_NAME = '#4 Cooper Kupp (WR, Rams) | Top 100 Players in 2022.mp4',
  FILE_PATH = 'https://firebasestorage.googleapis.com/v0/b/shark-4be33.appspot.com/o/%234%20Cooper%20Kupp%20(WR%2C%20Rams)%20%7C%20Top%20100%20Players%20in%202022.mp4?alt=media&token=53e18668-b339-4ba2-b7fc-f88fa2e033da'
}

export enum FallBackVideoID {
  ID = '65b9b9a74c7620f1c80955b1'
}
