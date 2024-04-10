/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useEffect, useState } from 'react'
import ChatMessagesItem from './ChatMessagesItem'
import { ActionType } from '../../widgets/VideoAssistant/hooks/useChatTypes'
import { ChatMessagesListProps } from './ChatMessagesListTypes'

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({ chatState, chatDispatch, videoRef, setChoosedElement }) => {
  const { arrayMessages, linkUrl } = chatState
  const handleClick = (event: React.MouseEvent<HTMLSpanElement>): void => {
    const timeString = linkUrl
    const regexPatternMinutesSecondsDash = /^ *(\d+[:.-]\d+) *to *(\d+[:.-]\d+) *$/i
    const regexPatternSeconds = /^(?:\d+\.\d+|\d+) to (?:\d+\.\d+|\d+)$/

    const isLinkSeconds = regexPatternSeconds.test(linkUrl)
    const isLinkMinutesSecondsDash = regexPatternMinutesSecondsDash.test(linkUrl)
    if (isLinkSeconds) {
      event.preventDefault()
      const [start, end] = timeString.split(' to ').map(Number)
      handleAnchorClickRange(start, end)
    } else if (isLinkMinutesSecondsDash) {
      event.preventDefault()
      const [start, end] = timeString.split(' to ').map(String)

      const [minutesFirst, secondsFirst] = start.split(':').map(Number)
      const [minutesSecond, secondsSecond] = end.split(':').map(Number)

      const totalTimeInSecondsFirst = minutesFirst * 60 + secondsFirst
      const totalTimeInSecondsSecond = minutesSecond * 60 + secondsSecond

      handleAnchorClickRange(totalTimeInSecondsFirst, totalTimeInSecondsSecond)
    } else {
      handleAnchorClick()
    }
  }
  function handleAnchorClick (): void {
    if (videoRef.current) {
      const timeString = linkUrl
      // here is the area for the potential improvement. need to add  universal logic
      if (linkUrl === '1:40') {
        const [minutes, seconds] = timeString.split(':').map(Number)

        if (!isNaN(minutes) && !isNaN(seconds)) {
          // Calculate the total time in seconds
          const totalTimeInSeconds = minutes * 60 + seconds

          // Set the video's currentTime
          videoRef.current.currentTime = totalTimeInSeconds
          videoRef.current.play()
        }
      } else {
        videoRef.current.currentTime = Number(linkUrl)
      }
    }
  }

  function handleAnchorClickRange (start: number, end: number): void {
    if (videoRef.current) {
      if (!isNaN(start) && !isNaN(end)) {
        videoRef.current.currentTime = start

        videoRef.current.addEventListener('timeupdate', function () {
          if (videoRef.current && videoRef.current.currentTime >= end) {
            videoRef.current.pause()
          }
        })

        videoRef.current.play()
      }
    }
  }

  const handleShow = (index: number | undefined, question: string): void => {
    chatDispatch({ type: ActionType.SET_RESPONSE_TEXT, payload: question })
    setChoosedElement(index)
    chatDispatch({ type: ActionType.SET_SHOW_MODAL, payload: true })
  }

  return (
    <div className={'flex flex-col gap-5'}>
    { arrayMessages?.map((message, index) => (
        <ChatMessagesItem
          message={message}
          index={index}
          handleClick={handleClick}
          handleShow={handleShow}
          key={index}
          chatState={chatState}/>
          
    ))}
    </div>
  )
}

export default ChatMessagesList
