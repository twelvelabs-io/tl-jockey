/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
export function formatTime (
  seconds: number,
  options?: { floor?: 'h' | 'm', digit?: boolean, trim?: boolean, placeholder?: string }
): string {
  let times: Array<{ value: number, unit: 'h' | 'm' | 's' }> = [
    { value: Math.floor(seconds / 3600), unit: 'h' },
    { value: Math.floor((seconds % 3600) / 60), unit: 'm' },
    { value: Math.floor(seconds % 60), unit: 's' }
  ]

  if (options?.floor) {
    times = times.slice(0, options.floor === 'h' ? 1 : 2)
  }

  if (options?.digit) {
    return times.map(({ value }) => value.toString().padStart(2, '0')).join(':')
  }

  if (options?.trim) {
    times = times.filter((t) => t.value > 0)
    if (times[0]?.unit === 'h') {
      times = times.filter(({ unit }) => unit !== 's')
    }
    if (times.length === 0) {
      return options.placeholder || '0s'
    }
  }

  if (options?.placeholder && seconds < 1) {
    return options.placeholder
  }

  return times.map(({ value, unit }) => `${value}${unit}`).join(' ')
}

export function formatDays (seconds: number): string {
  const days = Math.floor(seconds / 86400)
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  }
  return formatTime(seconds, { trim: true })
}

export function timeDiff (date: string): number {
  const now = new Date()
  const target = new Date(date)
  return Math.floor((target.getTime() - now.getTime()) / 1000) // in seconds
}
