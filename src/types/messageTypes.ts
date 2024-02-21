export interface Message {
    sender: 'user' | 'ai';
    text: string;
    link?: string;
    linkText?: string;
  }
  
export interface QuestionMessage extends Message {
    twelveText?: string;
    asrTest?: string;
    lameText?: string;
    question: string;
  }
  