/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useState, useEffect } from 'react';

const apiKey = process.env.REACT_APP_API_MAIN_KEY;
const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

  interface VideoFile {
    thumbnail: string;
    created_at: string;
    engines: any[]; 
    expires_at: string;
    index_name: string;
    total_duration: number;
    updated_at: string;
    video_count: number;
    _id: number;
}

const useGetVideosForIndex = (video: VideoFile) => {
  const [videoData, setVideoData] = useState<VideoFile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        if (!apiKey) {
            throw new Error('API key is not defined');
        }
        const response = await fetch(`${apiUrl}/${ video._id}/videos`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVideoData(data?.data[0]);
        } else {
          throw new Error('Failed to fetch data from API')
        //   setError('Failed to fetch data from API');
        }
      } catch (error) {
        throw new Error('Error fetch')
        // setError('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();

    return () => {
    };
  }, [video ]);

  return { videoData, loading, error };
};

export default useGetVideosForIndex;
