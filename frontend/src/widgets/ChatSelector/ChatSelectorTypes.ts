import { State } from '../VideoAssistant/hooks/useChatTypes';

export interface ChatSelectProps {
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

export enum FallBackVideoID {
  ID = '65b9b9a74c7620f1c80955b1'
}
