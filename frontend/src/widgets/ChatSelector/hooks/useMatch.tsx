import { useState, useEffect } from 'react'

import { Answer, Answers, MatchResult } from './useMatchTypes'

const useMatch = (
  answers: Answers,
  selectedFile: string,
  inputBox: string
): MatchResult => {
  const [link, setLink] = useState('')
  const [linkText, setLinkText] = useState('')
  const [arsTextCheck, setArsTextCheck] = useState('')
  const [lameTextCheck, setLameTextCheck] = useState('')
  const [matchingAnswer, setMatchingAnswer] = useState<Answer | undefined>(undefined)
  const [staticAnswer, setStaticAnswer] = useState(
    "I'm sorry, I don't have a specific answer for that question."
  )
  const [staticAnswerTwelve, setStaticAnswerTwelve] = useState(
    "I'm sorry, I don't have a specific answer for that question."
  )

  useEffect(() => {
    const answersFull = answers[selectedFile]
    const matchingAnswer = answersFull?.find((qa) => qa.question === inputBox)
    setMatchingAnswer(matchingAnswer)

    const linkAnswer = answersFull?.find((qa) => qa.link !== '' && qa.question === inputBox)
    const link = (linkAnswer != null && linkAnswer !== undefined) ? linkAnswer.link : ''
    setLink(link)

    const linkTextAnswer = answersFull?.find((qa) => qa.link !== '' && qa.question === inputBox)
    const linkText = (linkTextAnswer != null && linkTextAnswer !== undefined) ? linkTextAnswer.linkText : ''
    setLinkText(linkText)

    const asrTextMath = answersFull?.find((qa) => qa.question === inputBox && qa.asrTest !== '')
    const arsTextCheck = (asrTextMath != null && asrTextMath !== undefined) ? asrTextMath.asrTest : ''
    setArsTextCheck(arsTextCheck)

    const lameTextMath = answersFull?.find((qa) => qa.question === inputBox && qa.lameText !== '')
    const lameTextCheck = (lameTextMath != null && lameTextMath !== undefined) ? lameTextMath.lameText : ''
    setLameTextCheck(lameTextCheck)

    const staticAnswerValue = (matchingAnswer != null && matchingAnswer !== undefined) ? matchingAnswer.answer : "I'm sorry, I don't have a specific answer for that question."
    setStaticAnswer(staticAnswerValue)

    const staticAnswerTwelveValue = (matchingAnswer != null && matchingAnswer !== undefined) ? matchingAnswer.twelveText : "I'm sorry, I don't have a specific answer for that question."
    setStaticAnswerTwelve(staticAnswerTwelveValue)
  }, [answers, selectedFile, inputBox])

  return {
    link,
    linkText,
    arsTextCheck,
    lameTextCheck,
    staticAnswer,
    staticAnswerTwelve,
    matchingAnswer
  }
}

export default useMatch
