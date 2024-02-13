import { useState } from "react";

export interface VideoItem {
  thumbnail: string;
  created_at: string;
  engines: any[]; // Replace 'any[]' with the actual type of engines
  expires_at: string;
  index_name: string;
  total_duration: number;
  updated_at: string;
  video_count: number;
  _id: number;
}

export const useVideoList = (initialVideoList: VideoItem[] = []) => {
    const [videoList, setVideoList] = useState<VideoItem[]>(initialVideoList);
  
    const addVideo = (video: VideoItem) => {
      setVideoList((prevList) => [...prevList, video]);
    };
  
    const cancelVideo = (videoId: number) => {
      setVideoList((prevList) => prevList.filter((video) => video._id !== videoId));
    };

    const addFullList = (list: []) => {
      setVideoList(list)
    }

    const sortList = (sortBy: string) => {
      let sortedList: VideoItem[] = [...videoList];
      switch (sortBy) {
        case 'Recent upload':
          sortedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break;
        case 'Video duration':
          sortedList.sort((a, b) => b.total_duration - a.total_duration);
          break;
        case 'Video name':
          sortedList.sort((a, b) => b.index_name.localeCompare(a.index_name));
          break;
        default:
          break;
      }
      setVideoList(sortedList);
    };
  
    return { videoList, addVideo, cancelVideo, addFullList, sortList };
};