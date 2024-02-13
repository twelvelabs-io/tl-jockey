/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useEffect, useState } from 'react';

interface ApiResponse {

}

const apiKey = process.env.REACT_APP_API_MAIN_KEY
const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';

const useRetrieveVideoList = (
  currentPage: number,
  addFullList: (list: []) => void, 
  currentFilterStatus: string,
  sortList: (status: string) => void
) => {
  const [dataFetched, setDataFetched] = useState<boolean>(false)
  useEffect(() => {
    if (!dataFetched) {
      const fetchData = async () => {
        try {
          if (!apiKey) {
            throw new Error('API key is not defined');
          }

          const response = await fetch(`${apiUrl}?page=${currentPage}&page_limit=20&sort_by=created_at&sort_option=desc`, {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch data from API');
          }

          const data = await response.json();
          addFullList(data.data);
          setDataFetched(true); 
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [ currentPage ]);

  useEffect(() => {
    sortList(currentFilterStatus);
  }, [currentFilterStatus]);
};

export default useRetrieveVideoList;
