import axios from "axios";

const SERVER_BASE_URL = new URL(
  `${process.env.REACT_APP_BASE_SERVER}:${process.env.REACT_APP_BASE_PORT}`
);

const apiConfig = {
  TWELVE_LABS_API: axios.create({
    baseURL: SERVER_BASE_URL.toString(),
  }),
  PROXY_SERVER: "http://0.0.0.0:8000/stream_events",
  INDEXES_URL: "/indexes",
  SEARCH_URL: "/search",
  TASKS_URL: "/tasks",
};

export default apiConfig;
