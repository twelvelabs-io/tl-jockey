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

  export async function getOpenAISummary(jsonData) {
    const openAIKey = process.env.REACT_APP_OPENAI_API_KEY;
    const openAIEndpoint = 'https://api.openai.com/v1/chat/completions';
  
    try {
      const response = await axios.post(openAIEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Provide a concise summary of the following: ${jsonData}. In the output don't refer to JSON at all` }],
        max_tokens: 100,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
      });
  
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error fetching summary from OpenAI:', error);
      throw error;
    }
  }

