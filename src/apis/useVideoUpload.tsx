/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useState } from 'react';
import axios from 'axios';
import { FileId } from '../widgets/Dropzone/YoutubeUrlForm/indexTaskUploadState';
import { VideoType, isFileType, isUrlType } from '../widgets/Dropzone/YoutubeUrlForm/types';

const useVideoUpload = () => {
  const uploadVideos = async (videos: VideoType[]) => {
    const apiKey = 'tlk_1V6J4TC3646GX92VGH837303P6AX';
    const apiUrl = 'https://api.twelvelabs.io/p/v1.2/indexes';

    // Assuming you are using the Marengo video understanding engine
    const engines = [{ engine_name: 'pegasus1', engine_options: ['visual', 'conversation'] }];
    const addons = ['thumbnail']; // Enable thumbnail generation addon

    try {
      const uploadPromises = videos.map(async (video: VideoType) => {
        let indexName;

        if (isFileType(video)) {
          indexName = video.data.name;
        } else if (isUrlType(video)) {
          indexName = video.title;
        }

        const fileId = video.id as FileId;

        const headers = {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        };

        const options = {
          method: 'POST',
          headers: headers,
          data: JSON.stringify({
            index_name: indexName,
            engines: engines,
            addons: addons,
          }),
          url: apiUrl,
        };

        const response = await axios.post(
          'https://c748-2600-8802-3911-f100-781c-f009-472a-8814.ngrok-free.app/worker_generate_stream2',
          { options: options }
        );

        if (response.status === 200) {
          const index = response?.data?._id;
          console.log(`${index} Index created successfully`);
          console.log(index);
          return index;
        } else {
          console.error('Failed to create index:', response.statusText);
          return null;
        }
      });

      const indexes = await Promise.all(uploadPromises);
      return indexes.filter((index) => index !== null);
    } catch (error) {
      console.error('An error occurred while creating the indexes:', error);
      return [];
    }
  };

  return { uploadVideos };
};

export default useVideoUpload;
