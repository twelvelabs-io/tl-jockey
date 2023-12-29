import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useQuery } from 'react-query'
import { getYoutubeMetadataKey } from './keys'
import { nextAPI } from './network'

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
		() => nextAPI.get<Response>(`/youtube-metadata?url=${url}`).then((res) => res.data),
		{ ...options, staleTime: Infinity }
	)
}
