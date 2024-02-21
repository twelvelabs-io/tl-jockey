import axios, { AxiosProgressEvent } from "axios"
import { UseMutationResult, useMutation } from "react-query"
import API_KEYS from "./apiKeys"
import { PLAYGROUND_API_URL, CREATE_TASK_URL, CREATE_TASK_WITH_YOUTUBE_URL, API_VERSION } from "./apiEndpoints"

export const twelveLabsAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/${API_VERSION}`
})

const headers = {
    'x-api-key': API_KEYS.MAIN,
    'Content-Type': 'multipart/form-data',
  };

  export function useCreateTask<
  Response extends {
    type: 'create_task';
    _id: string;
    message: string;
  },
  Params extends {
    index_id: string;
    video_file?: File;
    video_url?: string;
    transcription_file?: File;
    transcription_url?: string;
    language: 'en';
    disable_video_stream?: false;
  } & {
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    abortSignal?: AbortController['signal'];
  }
>(): UseMutationResult<Response, unknown, Params> {
  return useMutation(
    async ({ abortSignal: signal, onUploadProgress, ...params }: Params) => {

        const formData = new FormData();
        formData.append('index_id', params.index_id);

        if (params.video_file) {
            formData.append('video_file', params.video_file);
          }

          if (params.transcription_file) {
            formData.append('transcription_file', params.transcription_file);
          }
          formData.append('language', 'en');
          formData.forEach((value,key) => {
            console.log(key+" "+value)
          });

          console.log(formData.entries)

      const res = await axios
              .post<Response>(
                  CREATE_TASK_URL,
                  formData,
                  {
                      onUploadProgress,
                      signal,
                      headers: headers
                  })
          return res.data
    }
  );
}

export function useCreateTaskWithUrl<
	Response extends {
		_id: string
	},
	Params extends {
		index_id: string
		url: string
		abortSignal?: AbortController['signal']
	}
>(): UseMutationResult<Response, unknown, Params> {
	return useMutation(
        async ({ abortSignal: signal, ...params }: Params) => {
            const formData = new FormData()
            formData.append('index_id', params.index_id);
            formData.append('url', params.url);
            const res = await axios
            .post<Response>(
                CREATE_TASK_WITH_YOUTUBE_URL,
                formData,
                {
                    signal,
                    headers: headers
                })
            return res.data
        }
	)
}

/**
 * @important This mutation doesn't execute invalidation itself.
 */
export function useDeleteTask(): UseMutationResult<{ taskId: string }, unknown, string> {
	return useMutation((taskId: string) =>
		twelveLabsAPI.delete<undefined>(`/indexes/tasks/${taskId}`).then(() => ({ taskId }))
	)
}