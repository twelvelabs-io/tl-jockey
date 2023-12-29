import { useState } from "react";

interface VideoItem {
    id: number;
    title: string;
    url: string;
}

export const useArrayHook = (initialVideoList: VideoItem[] = []) => {
    const [videoList, setVideoList] = useState<VideoItem[]>(initialVideoList);
  
    const addVideo = (video: VideoItem) => {
      setVideoList((prevList) => [...prevList, video]);
    };
  
    const cancelVideo = (videoId: number) => {
      setVideoList((prevList) => prevList.filter((video) => video.id !== videoId));
    };
  
    return { videoList, addVideo, cancelVideo };
};