/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useEffect, useState } from 'react';

const useGetVideoFromIndex = (index_id: unknown) => {
  const [videoStateInfo, setVideoStateInfo] = useState();

  useEffect(() => {
    const apiKey = process.env.REACT_APP_API_MAIN_KEY;
    const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

    const fetchData = async () => {
      try {
        if (!apiKey) {
          throw new Error('API key is not defined');
        }
        const response = await fetch(`${apiUrl}/${index_id}/videos`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVideoStateInfo(data?.data[0]?._id);
        } else {
          console.error('Failed to fetch data from API');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => {
    };
  }, [index_id]);

  return videoStateInfo;
};

export default useGetVideoFromIndex;
