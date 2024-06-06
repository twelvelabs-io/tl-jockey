/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable no-tabs */
import { type SVGProps } from 'react'
import { type JSX } from 'react/jsx-runtime'
import muiSvg from './muiSvg'
import React from 'react'

const VideoLibrary = muiSvg(
  (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>): JSX.Element => (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M3.33333 4.99999H1.66667V16.6667C1.66667 17.5833 2.41667 18.3333 3.33333 18.3333H15V16.6667H3.33333V4.99999ZM16.6667 1.66666H6.66667C5.75 1.66666 5 2.41666 5 3.33332V13.3333C5 14.25 5.75 15 6.66667 15H16.6667C17.5833 15 18.3333 14.25 18.3333 13.3333V3.33332C18.3333 2.41666 17.5833 1.66666 16.6667 1.66666ZM10 12.0833V4.58332L15 8.33332L10 12.0833Z"
				fill="currentColor"
			/>
		</svg>
  )
)

export default VideoLibrary
