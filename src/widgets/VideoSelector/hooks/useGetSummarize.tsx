/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useState, useEffect } from 'react';

const apiKey = process.env.REACT_APP_API_MAIN_KEY;
const apiUrl = 'https://api.twelvelabs.space/v1.2/indexes';
const summarizeApiUrl = 'https://api.twelvelabs.space/v1.2/summarize'

interface SummarizeResult {
    url: string;
    id: string;
    filename: string;
    summary: string;
  }

const useGetSummarize = () => {
  const [summarizeResultId, setSummarizeResultId] = useState<SummarizeResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!apiKey) {
            throw new Error('API key is not defined');
          }
        const response = await fetch(`${apiUrl}?page=1&page_limit=20&sort_by=created_at&sort_option=desc`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          const filteredData = data.data.filter((element: { total_duration: number; }) => element.total_duration !== 0);
  
          const fetchSummarizeData = async (element: { _id: any; }) => {
            const responseVideoForEachIndex = await fetch(`${apiUrl}/${element._id}/videos`, {
              method: 'GET',
              headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
              },
            });
  
            if (responseVideoForEachIndex.ok) {
              const videoData = await responseVideoForEachIndex.json();
              const responseGetUrl = await fetch(`${apiUrl}/${element._id}/videos/${videoData.data[0]._id}`, {
                method: 'GET',
                headers: {
                  'x-api-key': apiKey,
                  'Content-Type': 'application/json',
                },
              });
  
              if (responseGetUrl.ok) {
                const data = await responseGetUrl.json();
                const summarizeOptions = {
                  method: 'POST',
                  headers: {
                    accept: 'application/json',
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ type: 'summary', video_id: data._id })
                };
  
                const summarizeResponse = await fetch(summarizeApiUrl, summarizeOptions);
                if (summarizeResponse.ok) {
                  const summarizeData = await summarizeResponse.json();
                    return { 
                        url: data.hls.video_url, 
                        id: data._id, 
                        filename: data.metadata.filename, 
                        summary: summarizeData.summary 
                    };
                } else {
                  console.error('Failed to fetch summarize data from API');
                }
              }
            }
          };
  
          const summarizeResults = await Promise.all(filteredData.map(fetchSummarizeData));
          setSummarizeResultId(summarizeResults.filter(result => result));
        } else {
          console.error('Failed to fetch data from API');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData(); 
  }, []);

  return summarizeResultId;
};

export default useGetSummarize
