/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { IndexResponse } from '../../indexes'
import type { AxiosInstance } from 'axios'
import type { TwelveLabsApiError } from './response'

import { getIndexKey } from '../../indexes/keys'
import { useMemo } from 'react'
import { atomFamily, useRecoilValue } from 'recoil'
import { sampleAPI, twelveLabsAPI } from './network'
import queryClient from './queryClient'

const isSampleIndexAtom = atomFamily<boolean, string>({
	key: 'isSampleIndexAtom',
	default: async (indexId?: string): Promise<boolean> => {
		if (!indexId) return false

		// get cached index data
		const cachedIndex = queryClient.getQueryData<IndexResponse>(getIndexKey(indexId))
		if (cachedIndex != null) return cachedIndex.sample ?? false

		// fetch index data
		try {
			const index = await twelveLabsAPI
				.get<IndexResponse>(`/indexes/${indexId}`)
				.then((res: { data: any }) => res.data)
				.catch((err: any) => {
					const error = err as TwelveLabsApiError
					if (error.isAxiosError && error.response?.status === 404) {
						return sampleAPI.get<Response>(`/indexes/${indexId}`).then((res: { data: any }) => ({ ...res.data, sample: true }))
					}
					return err
				})
			queryClient.setQueryData(getIndexKey(indexId), index)

			return index.sample ?? false
		} catch (e) {
			return false
		}
	}
})

export const useApi = (indexId = ''): AxiosInstance => {
	const isSampleIndex = useRecoilValue(isSampleIndexAtom(indexId))
	return useMemo(() => (isSampleIndex ? sampleAPI : twelveLabsAPI), [isSampleIndex])
}
