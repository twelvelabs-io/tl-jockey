import type { UseMutationResult, UseQueryOptions, UseQueryResult } from 'react-query'
import type { DefaultResponse, IndexStatus, PageResponseFormat } from './response'

import { getIndexesKey } from '../../indexes'
import { useRef } from 'react'
import { useQueryClient, useMutation, useQuery } from 'react-query'
import { useApi } from './useApi'
import { twelveLabsAPI } from './network'

import { getTaskKey, getTasksKey, getTaskStatusKey } from './keys'

export interface TaskParams {
	_id?: string
	index_id?: string
	filename?: string
	duration?: number
	width?: number
	height?: number
	created_at?: string
	updated_at?: string
	estimated_time?: string
	/**
	 * @default created_at
	 */
	sort_by?: 'created_at' | 'updated_at' | 'duration' | 'filename' | 'width' | 'height'
	/**
	 * @default desc
	 */
	sort_option?: 'asc' | 'desc'
	/**
	 * Put tasks which status is not ready first
	 */
	indexing_first?: true
	/**
	 * Number of items to return per page.
	 * Maximum value is 100
	 * @default 10
	 */
	page_limit?: number
	/**
	 * Page number.
	 * @default 0
	 */
	page?: number
}

interface TaskResponse extends DefaultResponse {
	estimated_time: string // date format
	index_id: string
	video_id?: string
	metadata: {
		duration: number
		filename: string
		width: number
		height: number
	}
	status: IndexStatus
	process?: {
		upload_percentage: number
		remain_seconds: number
	}
	error_reason?: string // show up when status is 'failed'
}

export function useTasks<
	Response extends PageResponseFormat<TaskResponse, 'list_index_task'>,
	Params extends Omit<TaskParams, 'index_id'>
>(
	index_id: string,
	params?: Params,
	options?: UseQueryOptions<Response, unknown, Response, ReturnType<typeof getTasksKey>>
): UseQueryResult<Response> {
	const api = useApi(index_id)
	return useQuery(
		getTasksKey(index_id, params),
		async () => api.get<Response>(`/tasks`, { params: { index_id, ...params } }).then((res) => res.data),
		options as any
	)
}

type TaskStatus =
	| ({ index_id: string; total_result: number } & Record<Exclude<IndexStatus, 'broken_video_file'>, number>)
	| null

export function useTaskStatus<Response extends TaskStatus>(
	indexId: string,
	options?: UseQueryOptions<Response, unknown, Response, ReturnType<typeof getTaskStatusKey>>
): UseQueryResult<Response> {
	const cacheRef = useRef<Response>()
	const queryClient = useQueryClient()
	const api = useApi(indexId)
	return useQuery(
		getTaskStatusKey(indexId),
		async () => api.get<Response>('/tasks/status', { params: { index_id: indexId } }).then((res) => res.data),
		{
			refetchInterval: (data) => (data && data.indexing > 0 ? 2000 : false),
			onSuccess: (data) => {
				const cache = cacheRef.current
				cacheRef.current = data
				if (cache == null) return

				const isIndexingFinishedVideoCountChanged = cache.ready !== data?.ready || cache.failed !== data.failed
				if (isIndexingFinishedVideoCountChanged) {
					queryClient.resetQueries(getIndexesKey())
				}
			},
			...options
		}
	)
}

// default HLS information returned from tl-api-backend
interface TaskHLS {
	status: 'COMPLETE' | 'ERROR' | 'CANCELED'
	video_url: string
	thumbnail_urls: string[]
	vtt_url?: string
	updated_at: Date
}

// extended and overridden HLS information returned from tl-api-playground-backend
export interface TaskHLSWithMux extends Omit<TaskHLS, 'status'> {
	status: TaskHLS['status'] | 'preparing' | 'ready' | 'errored'
}

interface SingleTaskResponse extends TaskResponse {
	hls?: TaskHLSWithMux
}

export function useTask<Response extends SingleTaskResponse>(
	taskId: string,
	indexId?: string,
	options?: UseQueryOptions<Response, unknown, Response, ReturnType<typeof getTaskKey>>
): UseQueryResult<Response> {
	const api = useApi(indexId)
	return useQuery(
		getTaskKey(taskId),
		async () => api.get<Response>(`/tasks/${taskId}`).then((res) => res.data),
		options
	)
}

export function useGetTask<Response extends SingleTaskResponse, TaskId extends string>(): UseMutationResult<
	Response,
	unknown,
	TaskId
> {
	return useMutation((taskId: TaskId) => twelveLabsAPI.get<Response>(`/tasks/${taskId}`).then((res) => res.data))
}

/**
 * @important This mutation doesn't execute invalidation itself.
 */
/**
 * Upload video with external providers (only support youtube URL for now)
 */
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
	return useMutation(({ abortSignal: signal, ...params }) =>
		twelveLabsAPI.post<Response>('/tasks/external-provider', params, { signal }).then((res) => res.data)
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
