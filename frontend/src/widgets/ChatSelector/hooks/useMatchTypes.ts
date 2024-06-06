export interface Answer {
    question: string
    link: string
    linkText: string
    asrTest: string
    lameText: string
    answer: string
    twelveText: string
  }
  
export type Answers = Record<string, Answer[]>
  
export interface MatchResult {
    link: string
    linkText: string
    arsTextCheck: string
    lameTextCheck: string
    staticAnswer: string
    staticAnswerTwelve: string
    matchingAnswer: Answer | undefined
  }