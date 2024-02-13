import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useQuery } from 'react-query'
import { getYoutubeMetadataKey } from './keys'
import { nextAPI } from './network'
import axios from 'axios'

interface YoutubeMetadataResponse {
	title: string
	thumbnail_url: string
}

export function useYoutubeMetadata<Response extends YoutubeMetadataResponse>(
	url: string,
	options?: UseQueryOptions<Response, unknown, Response, ReturnType<typeof getYoutubeMetadataKey>>
): UseQueryResult<Response> {
	return useQuery(
		getYoutubeMetadataKey(url),
		() => axios.get<Response>(`http://youtube.com/oembed?url=${url}`).then((res) => res.data),
		{ ...options, staleTime: Infinity }
	)
}
