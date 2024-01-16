const TASKS = 'tasks'

export function getTasksKey(): [typeof TASKS]
export function getTasksKey(indexId: string): [typeof TASKS, { indexId: string }]
export function getTasksKey<Params>(indexId: string, params: Params): [typeof TASKS, { indexId: string }, Params]
export function getTasksKey<Params = Record<string, unknown>>(indexId?: string, params?: Params): unknown {
	if (!indexId) return [TASKS]
	if (!params) return [TASKS, { indexId }]
	return [TASKS, { indexId }, params]
}

export const getTaskKey = (taskId: string): [typeof TASKS, string] => [TASKS, taskId]

export const getTaskStatusKey = (indexId: string): [typeof TASKS, { indexId: string }, 'status'] => [
	...getTasksKey(indexId),
	'status' as const
]
