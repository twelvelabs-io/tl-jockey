import { useEffect } from "react";
import ReactPlayer from "react-player";

interface useVideoElementEffectProps {
    videoRef: React.RefObject<ReactPlayer>;
    startTime: number
    endTime: number;
    videoUrl: string;
    showModal: boolean
}

export const useVideoElementEffect = ({ videoRef, startTime, endTime, videoUrl, showModal }: useVideoElementEffectProps) => {
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const player = videoRef.current;

    const onLoadedMetadata = () => {
      if (startTime && player) {
        player.seekTo(startTime, "seconds");
      }
    };

    const onTimeUpdate = () => {
      if (endTime && player) {
        const currentTime = player.getCurrentTime();
        if (currentTime >= endTime) {
          player.getInternalPlayer()?.pause();
        }
      }
    };

    if (player) {
      // Trigger the initial metadata load action
      onLoadedMetadata();

      // Start an interval to check the time updates
      interval = setInterval(onTimeUpdate, 100);
    }

    return () => {
      // Clear the interval and ensure the player is not accessed if unmounted
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [videoUrl, showModal, startTime, endTime, videoRef]);
  };

  export default useVideoElementEffect