import axios from "axios";

const SERVER_BASE_URL = new URL(`https://twelve-server3-8f54ec333541.herokuapp.com/`)

const apiConfig = {
  TWELVE_LABS_API: axios.create({
    baseURL: SERVER_BASE_URL.toString(),
  }),
  PROXY_SERVER: "https://twelve-fast-6e09a0ec0080.herokuapp.com/stream_events",
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
