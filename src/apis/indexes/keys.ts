const INDEXES = 'indexes'

export function getIndexesKey(): [typeof INDEXES]
export function getIndexesKey<Params = Record<string, unknown>>(params: Params): [typeof INDEXES, Params]
export function getIndexesKey<Params = Record<string, unknown>>(params?: Params): unknown {
	if (!params) return [INDEXES]
	return [INDEXES, params]
}

export const getIndexKey = (indexId: string): [typeof INDEXES, string] => [INDEXES, indexId]
