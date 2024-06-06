/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { SVGProps } from 'react'

import { styled } from '@mui/material/styles'
import { get } from 'lodash'

function anyToRem (value: number | string, spacing: (value: number) => string): string {
  if (typeof value === 'string') {
    return value
  }
  return spacing(value)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const muiSvg = (component: (props: SVGProps<SVGSVGElement>) => JSX.Element) =>
  styled(component, { shouldForwardProp: (prop) => prop !== 'sx' && prop !== 'fontSize' })(
    ({ theme, width, height, color = 'text.secondary', fontSize = 24 }) => ({
      width: anyToRem(width ?? fontSize, theme.spacing),
      height: anyToRem(height ?? fontSize, theme.spacing),
      color: get(theme.palette, color) || color
    })
  )

export default muiSvg
