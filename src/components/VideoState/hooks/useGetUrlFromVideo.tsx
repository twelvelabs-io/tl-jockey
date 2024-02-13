/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useEffect, useState } from 'react';

const useGetUrlFromVideo = (indexId: string | number, videoId: string | number) => {
  const [videoStateUrl, setVideoStateUrl] = useState<string | undefined>();

  useEffect(() => {
    const fetchDataUrl = async () => {
      try {
        const apiKey = process.env.REACT_APP_API_MAIN_KEY;
        const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

        if (!apiKey) {
          throw new Error('API key is not defined');
        }

        const response = await fetch(`${apiUrl}/${indexId}/videos/${videoId}`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVideoStateUrl(data.hls.video_url);
        } else {
          console.error('Failed to fetch data from API');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDataUrl();
  }, [indexId, videoId]);

  return videoStateUrl;
};

export default useGetUrlFromVideo;
