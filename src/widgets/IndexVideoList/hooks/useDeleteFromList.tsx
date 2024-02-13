/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useState } from 'react';

interface DeleteVideoResponse {
  success: boolean;
  error?: string;
}

const apiKey = process.env.REACT_APP_API_MAIN_KEY;
const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

const useDeleteFromList = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteVideo = async (index: string, videoId: string): Promise<DeleteVideoResponse> => {
    setLoading(true);
    try {
      if (!apiKey) {
        throw new Error('API key is not defined');
      }
      const deleteResponse = await fetch(`${apiUrl}/${index}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (deleteResponse.ok) {
        return { success: true };
      } else {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.message || 'Failed to delete video');
      }
    } catch (error) {
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { deleteVideo, loading, error };
};

export default useDeleteFromList
