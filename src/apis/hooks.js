import axios from "axios"
import { useQuery } from "react-query"
import { PLAYGROUND_API_URL, API_VERSION } from "./apiEndpoints"
import apiConfig from "./apiConfig"
export const twelveLabsAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/${API_VERSION}`
})
import keys from "./keys";

  export function useGetVideos(indexId, page, pageLimit) {
    return useQuery({
      queryKey: [keys.VIDEOS, indexId, page],
      queryFn: async () => {
        try {
          const response = await apiConfig.TWELVE_LABS_API.get(
            `${apiConfig.INDEXES_URL}/${indexId}/videos`,
            {
              params: { page, page_limit: pageLimit },
            }
          );
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    });
  }

  export function useRetrieveVideoInfo(indexId, videoId) {
    return useQuery({
      queryKey: [keys.VIDEOS, indexId, videoId],
      queryFn: async () => {
        try {
          const response = await apiConfig.TWELVE_LABS_API.get(
            `${apiConfig.INDEXES_URL}/${indexId}/videos/${videoId}`
          );
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    });
  }

