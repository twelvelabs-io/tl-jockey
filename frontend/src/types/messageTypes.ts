export interface Message {
    sender: 'user' | 'ai' | 'initial';
    text: string;
    link?: string;
    linkText?: string;
  }

export interface VideoInfo {
    url: string;
  }
  
  export interface QuestionMessage extends Message {
    twelveText?: string;
    asrTest?: string;
    lameText?: string;
    question: string;
    toolsData: {
        end: number;
        start: number;
        thumbnail_url: string | undefined;
        video_url: string;
        metadata: {
            type: string;
            text: string;
        }[];
        video_title: string;
    }[];
    handleShow: (index: number | undefined, question: string) => void;
}

export interface PanelVideos {
    hls: {
      video_url: string;
      thumbnails_urls: string[];
    };
    metadata: {
      duration: number;
      filename: string;
    };
    _id: string
  }
  

  export interface ToolsData {
    confidence: string;
    end: number;
    metadata: {
        text: string;
        type: string;
    }[];
    modules: {
        type: string;
        confidence: string;
    }[];
    score: number;
    start: number;
    thumbnail_url: string;
    video_id: string;
    video_url: string;
    video_title: string
}

export enum ModalType {
  MESSAGES = "messages",
  PANEL = "panel",
  CLEAR_CHAT = "clear_chat"
}