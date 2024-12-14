/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export const formatTime = (start: number): string => {
  const minutes = Math.floor(start / 60);
  const seconds = Math.floor(start % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};