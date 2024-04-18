export function formatTime(start:number, end:number) {
    const formatTimeSegment = (timeSegment:number) => {
      return timeSegment.toString().padStart(2, '0');
    };
  
    const hours = Math.floor(start / 3600);
    const minutes = Math.floor((start % 3600) / 60);
    const seconds = start % 60;
  
    const formattedStart = `${formatTimeSegment(hours)}:${formatTimeSegment(minutes)}:${formatTimeSegment(seconds)}`;
  
    const endHours = Math.floor(end / 3600);
    const endMinutes = Math.floor((end % 3600) / 60);
    const endSeconds = end % 60;
  
    const formattedEnd = `${formatTimeSegment(endHours)}:${formatTimeSegment(endMinutes)}:${formatTimeSegment(endSeconds)}`;
  
    return `${formattedStart} - ${formattedEnd}`;
  }