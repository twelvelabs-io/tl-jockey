export interface Message {
    sender: 'user' | 'ai' | 'initial';
    text: string;
    link?: string;
    linkText?: string;
  }
  
export interface QuestionMessage extends Message {
    twelveText?: string;
    asrTest?: string;
    lameText?: string;
    question: string;
    toolsData?: ToolsData []
    handleShow: (index: number | undefined, question: string) => void
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
}