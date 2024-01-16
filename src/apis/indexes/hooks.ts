/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type {
	UseInfiniteQueryOptions,
	UseInfiniteQueryResult,
	UseMutationResult,
	UseQueryOptions,
	UseQueryResult
} from 'react-query'
import type { DefaultResponse, PageResponseFormat, Sample } from '../../apis/ChatApiHandler/tasks/response'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from 'react-query'
import { useApi } from '../../apis/ChatApiHandler/tasks/useApi'
import { sampleAPI, twelveLabsAPI } from '../../apis/ChatApiHandler/tasks/network'

import { getIndexesKey, getIndexKey } from './keys'

export enum Engine {
	MARENGO_2_5 = 'marengo2.5',
	MARENGO_2 = 'marengo2',
	PEGASUS_1 = 'pegasus1'
}

enum EngineNumeric {
	'pegasus1',
	'marengo2.5',
	'marengo2'
}
export function sortEngines(x: Engine, y: Engine): number {
	return EngineNumeric[x] - EngineNumeric[y]
}

type MarengoData = { engine_name: Engine.MARENGO_2 | Engine.MARENGO_2_5; engine_options: IndexOption[] }
type PegasusData = {
	engine_name: Engine.PEGASUS_1
	engine_options: (IndexOption.visual | IndexOption.conversation)[]
}
export type EngineData = MarengoData | PegasusData

export function isMarengo(engineData: EngineData): engineData is MarengoData {
	return engineData.engine_name.includes('marengo')
}

export function isPegasus(engineData: EngineData): engineData is PegasusData {
	return engineData.engine_name.includes('pegasus')
}

export enum IndexOption {
	'visual' = 'visual',
	'conversation' = 'conversation',
	'text_in_video' = 'text_in_video',
	'logo' = 'logo'
}

export enum IndexAddon {
	'thumbnail' = 'thumbnail'
}

export enum GroupBy {
	'clip' = 'clip',
	'video' = 'video'
}

enum IndexOptionNumeric {
	'visual',
	'conversation',
	'text_in_video',
	'logo',
	'thumbnail'
}
export function sortIndexOptions<T extends IndexOption | IndexAddon>(x: T, y: T): number {
	return IndexOptionNumeric[x] - IndexOptionNumeric[y]
}

export interface IndexesParams {
	/**
	 * @default 0
	 */
	page?: number
	/**
	 * @default 10
	 * @max 100
	 */
	page_limit?: number
	/**
	 * @default 'created_at'
	 */
	sort_by?: 'created_at' | 'updated_at' | 'video_count'
	/**
	 * @default 'desc
	 */
	sort_option?: 'asc' | 'desc'
	index_name?: string
	engine_id?: Engine
	engine_family?: 'marengo' | 'pegasus'
	/**
	 * @default 'playground'
	 */
	params?: string
}

export interface IndexResponse extends DefaultResponse, Sample {
	index_name: string
	addons: IndexAddon[]
	engines: EngineData[]
	video_count: number
	total_duration: number
	expires_at?: string
}

export function useInfiniteIndexes<
	Response extends PageResponseFormat<IndexResponse> & Sample,
	Params extends Omit<IndexesParams, 'page'>,
	PageParam extends { page?: number; sample?: boolean }
>(
	params?: Params,
	options?: Omit<
		UseInfiniteQueryOptions<Response, unknown, Response, Response, ReturnType<typeof getIndexesKey>>,
		'queryKey' | 'queryFn'
	>
): UseInfiniteQueryResult<Response> {
	const aggregatedParams: Params = {
		...(params as Params)
	}
	return useInfiniteQuery(
		getIndexesKey(aggregatedParams),
		async ({ pageParam }: { pageParam?: PageParam }) => {
			if (pageParam?.sample) {
				return sampleAPI
					.get<Response>('/indexes', { params: { ...aggregatedParams, page: pageParam.page } })
					.then(({ data }) => ({ ...data, data: data.data.map((item) => ({ ...item, sample: true })), sample: true }))
			}
			return twelveLabsAPI
				.get<Response>('/indexes', { params: { ...aggregatedParams, page: pageParam?.page } })
				.then((res) => res.data)
		},
		{
			...(options as any),
			getNextPageParam: ({ page_info, sample }: Response) => {
				const page = page_info.page < page_info.total_page ? page_info.page + 1 : undefined
				if (page != null) return { page, sample }
				if (!sample) return { page: 1, sample: true } // If there are no more pages on indexes, move on to sample indexes
				return undefined
			}
		}
	)
}

export function useIndex<Response extends IndexResponse>(
	indexId: string,
	options?: UseQueryOptions<Response, unknown, Response, ReturnType<typeof getIndexKey>>
): UseQueryResult<Response> {
	const api = useApi(indexId)
	return useQuery(
		getIndexKey(indexId),
		async () =>
			api.get<Response>(`/indexes/${indexId}`).then((res) => {
				if (api === twelveLabsAPI) return res.data
				return { ...res.data, sample: true }
			}),
		options
	)
}

export interface IndexParams {
	index_name: string
	engines: (
		| { engine_name: Engine.PEGASUS_1; engine_options: (IndexOption.visual | IndexOption.conversation)[] }
		| { engine_name: Engine.MARENGO_2 | Engine.MARENGO_2_5; engine_options: IndexOption[] }
	)[]
	addons?: IndexAddon[]
}

export function useCreateIndex<
	Response extends {
		type: 'create_index'
		_id: string
		message: string
	},
	Params extends IndexParams
>(): UseMutationResult<Response, unknown, Params> {
	const queryClient = useQueryClient()

	return useMutation((params: Params) => twelveLabsAPI.post<Response>('/indexes', params).then((res) => res.data), {
		onSuccess: () => {
			queryClient.invalidateQueries(getIndexesKey(), {
				refetchInactive: true
			})
		}
	})
}

export function useUpdateIndex<
	Response extends { type: 'update_index'; data: string },
	Params extends { index_id: string } & Pick<IndexParams, 'index_name'>
>(): UseMutationResult<Response, unknown, Params> {
	const queryClient = useQueryClient()

	return useMutation(
		({ index_id, index_name }: Params) =>
			twelveLabsAPI.put<Response>(`/indexes/${index_id}`, { index_name }).then((res) => res.data),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(getIndexesKey(), {
					refetchInactive: true
				})
			}
		}
	)
}

export function useDeleteIndex<
	Response extends {
		type: 'delete_index'
		message: string
	},
	Params extends { index_id: string }
>(): UseMutationResult<Response, unknown, Params> {
	const queryClient = useQueryClient()

	return useMutation(
		({ index_id }: Params) => twelveLabsAPI.delete<Response>(`/indexes/${index_id}`).then((res) => res.data),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(getIndexesKey(), {
					refetchInactive: true
				})
			}
		}
	)
}
