/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useMemo } from 'react'
import { atom, atomFamily, selector, selectorFamily, useRecoilCallback, useRecoilValue } from 'recoil'
import { TaskErrorCode } from '../../../apis/ChatApiHandler/tasks/response'

export type FileId = string & { __brand: 'FileId' }

export enum LegacyUploadErrorCode {
	'Canceled' = 300,
	'Failed',
	'TooSmall',
	'TooLarge',
	'TooLong',
	'TooShort',
	'NoAudio',
	'InsufficientFunds' = 601,
	'OutOfCredit' = 1001
}

interface IndexTaskUploadState {
	name: string
	indexId: string
	isValidated: boolean
	/**
	 * Upload progress. 0 ~ 100
	 */
	progress: number
	/**
	 * 300 Cancel upload video -> client-only code
	 *
	 * 301 Failed to upload video
	 *
	 * 302 Too small resolution (Min resolution: 300p)
	 *
	 * 303 Too large resolution (Max resolution: 1080p)
	 *
	 * 304 Too long video (Max video duration: 7200sec)
	 *
	 * 305 Too short video (Min video duration: 10sec)
	 *
	 * 306 Audio does not exist
	 *
	 * 601 Insufficient funds
	 *
	 * 1001 Out of credit
	 */
	code?: TaskErrorCode
	/**
	 * After upload is complete, `taskId` will be set
	 */
	taskId?: string
	/**
	 * After `taskId` or `error` is set, `cancel()` will be deleted from state
	 */
	cancel?: () => void
}
const indexTaskUploadAtoms = atomFamily<IndexTaskUploadState, FileId>({
	key: 'indexTaskUploadAtoms',
	default: { name: '', indexId: '', isValidated: false, progress: 0 }
})

interface IndexTaskUploadStateWithFlag extends IndexTaskUploadState {
	isUploaded: boolean
}
const indexTaskUploadWithFlagSelector = selectorFamily<IndexTaskUploadStateWithFlag, FileId>({
	key: 'indexTaskUploadWithFlagSelector',
	get:
		(fileId: FileId) =>
		({ get }): IndexTaskUploadStateWithFlag => {
			const state = get(indexTaskUploadAtoms(fileId))
			return {
				...state,
				isUploaded: Boolean(state.code) || state.progress === 100,
				isValidated: Boolean(state.code) || state.isValidated
			}
		}
})

const fileIdsAtom = atom<FileId[]>({
	key: 'fileIdsAtom',
	default: []
})

export function useIndexTaskUpload(fileId: FileId): IndexTaskUploadStateWithFlag {
	return useRecoilValue(indexTaskUploadWithFlagSelector(fileId))
}

export function useUploadFileIds(): FileId[] {
	return useRecoilValue(fileIdsAtom)
}

const uploadingFileCountSelector = selectorFamily<number, string | undefined>({
	key: 'isIndexTaskUploadingSelector',
	get:
		(indexId?: string) =>
		({ get }): number => {
			const fileIds = get(fileIdsAtom)
			let files = fileIds.map((fileId) => get(indexTaskUploadWithFlagSelector(fileId)))
			if (indexId) files = files.filter((file) => file.indexId === indexId)
			return files.filter((file) => !file.isUploaded).length
		}
})
export function useUploadingFileCount(indexId?: string): number {
	return useRecoilValue(uploadingFileCountSelector(indexId))
}

const isIndexTaskValidatingSelector = selector<boolean>({
	key: 'isIndexTaskValidatingSelector',
	get: ({ get }): boolean => {
		const fileIds = get(fileIdsAtom)
		return fileIds.some((fileId) => !get(indexTaskUploadWithFlagSelector(fileId)).isValidated)
	}
})
export function useIsIndexTaskValidating(): boolean {
	const isIndexTaskValidating = useRecoilValue(isIndexTaskValidatingSelector)
	return useMemo(() => isIndexTaskValidating, [isIndexTaskValidating])
}

export function useSetIndexTaskUpload(): (params: { fileId: FileId } & Partial<IndexTaskUploadState>) => void {
	return useRecoilCallback(
		({ set }) =>
			function setIndexTaskUpload({ fileId, ...params }: { fileId: FileId } & Partial<IndexTaskUploadState>): void {
				set(indexTaskUploadAtoms(fileId), (state) => {
					const nextState = { ...state, ...params }
					const isUploaded: boolean = Boolean(nextState.code) || nextState.progress === 100
					if (isUploaded && nextState.cancel) {
						delete nextState.cancel
						return nextState
					}

					if (params.cancel) {
						nextState.cancel = (): void => {
							params.cancel?.()
							set(indexTaskUploadAtoms(fileId), (s) => ({ ...s, code: TaskErrorCode.Canceled }))
						}
					}

					return nextState
				})
				set(fileIdsAtom, (state) => {
					if (state.some((id) => id === fileId)) return state
					return [...state, fileId]
				})
			},
		[]
	)
}

export function useCancelAllTaskUpload(): () => Promise<void> {
	return useRecoilCallback(
		({ snapshot }) =>
			async function cancelAllUploadTasks() {
				const fileIds = await snapshot.getPromise(fileIdsAtom)
				await Promise.all(
					fileIds.map(async (fileId) => {
						const uploadTask = await snapshot.getPromise(indexTaskUploadAtoms(fileId))
						uploadTask?.cancel?.()
					})
				)
			},
		[]
	)
}

export function useClearValidatedTaskUpload(): () => Promise<void> {
	return useRecoilCallback(
		({ snapshot, set, reset }) =>
			async function clearAllUploadTasks() {
				const fileIds = await snapshot.getPromise(fileIdsAtom)
				const checkedFileIds = await Promise.all(
					fileIds.map(async (fileId): Promise<FileId | null> => {
						const uploadTask = await snapshot.getPromise(indexTaskUploadAtoms(fileId))
						if (!uploadTask.isValidated) return fileId
						reset(indexTaskUploadAtoms(fileId))
						return null
					})
				)
				set(
					fileIdsAtom,
					checkedFileIds.filter((v): v is FileId => v != null)
				)
			},
		[]
	)
}
