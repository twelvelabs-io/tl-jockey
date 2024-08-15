import axios from "axios";

const SERVER_BASE_URL = new URL(process.env.BASE_SERVER)

const apiConfig = {
  TWELVE_LABS_API: axios.create({
    baseURL: SERVER_BASE_URL.toString(),
  }),
  PROXY_SERVER: process.env.PROXY_SERVER,
  INDEXES_URL: "/indexes",
  SEARCH_URL: "/search",
  TASKS_URL: "/tasks",
  JSON_VIDEO_INFO_URL: new URL("/json-video-info", SERVER_BASE_URL),
  CHANNEL_VIDEO_INFO_URL: new URL("/channel-video-info", SERVER_BASE_URL),
  PLAYLIST_VIDEO_INFO_URL: new URL("/playlist-video-info", SERVER_BASE_URL),
  DOWNLOAD_URL: new URL("/download", SERVER_BASE_URL),
  UPDATE_VIDEO_URL: new URL("/update", SERVER_BASE_URL),
};

export default apiConfig;
