import type { AxiosError } from 'axios'

export interface DefaultResponse {
	_id: string
	created_at: string // Date format
	updated_at: string // Date format
}

export interface PageResponseFormat<Data, Type = string> {
	data: Data[]
	page_info: {
		limit_per_page: number
		page: number
		total_page: number
		total_results: number
	}
	type?: Type
}

export interface CachedPageResponseFormat<Data> {
	traceId: string // datadog trace id from header
	data: Data[]
	page_info: {
		limit_per_page: number
		prev_page_token?: string
		next_page_token?: string
		page_expired_at: string
		total_results: number
	}
}

export interface Sample {
	sample?: boolean // populate when data is from sample endpoint
}

export interface ExtraOptions {
	/**
	 * For debugging threshold
	 */
	extra_options?: string
}

export type TwelveLabsApiError = AxiosError<{
	code: GeneralErrorCode | IndexErrorCode | TaskErrorCode | SearchErrorCode | ClassifyErrorCode
	message: string
}>

export type IndexStatus = 'ready' | 'indexing' | 'validating' | 'queued' | 'pending' | 'failed'

export type Confidence = 'high' | 'medium' | 'low' | 'none'

export enum GeneralErrorCode {
	ApiKeyInvalid = 'api_key_invalid',
	ParameterInvalid = 'parameter_invalid',
	ParameterNotProvided = 'parameter_not_provided',
	ParameterUnknown = 'parameter_unknown',
	TagsNotAllowed = 'tags_not_allowed',
	EndpointNotExists = 'endpoint_not_exists',
	ResourceNotExists = 'resource_not_exists',
	ApiUpgradeRequired = 'api_upgrade_required'
}

export enum IndexErrorCode {
	IndexNameAlreadyExists = 'index_name_already_exists'
}

export enum TaskErrorCode {
	TaskCannotBeDeleted = 'task_cannot_be_deleted',
	TranscriptionNotSupported = 'transcription_not_supported',
	TranscriptionUrlNotAccessible = 'transcription_url_not_accessible',
	TranscriptionUrlNotExists = 'transcription_url_not_exists',
	VideoAudioTrackNotExists = 'video_audio_track_not_exists',
	VideoDurationOutOfRange = 'video_duration_out_of_range',
	VideoFileBroken = 'video_file_broken',
	VideoResolutionOutOfRange = 'video_resolution_out_of_range',
	UsageLimitExceeded = 'usage_limit_exceeded',
	// external video error code (like Youtube)
	ExternalVideoInvalid = 'external_video_invalid',
	ExternalVideoNotEmbeddable = 'external_video_not_embeddable',
	ExternalVideoUnavailable = 'external_video_unavailable',
	ExternalVideoLiveUnsupported = 'external_video_live_unsupported',
	ExternalVideoDomainUnsupported = 'external_video_domain_unsupported',
	// client-side error code
	Canceled = 'canceled'
}

export enum SearchErrorCode {
	SearchFilterInvalid = 'search_filter_invalid',
	SearchParameterNotAllowed = 'search_parameter_not_allowed',
	SearchOptionCombinationNotSupported = 'search_option_combination_not_supported',
	SearchOptionNotSupported = 'search_option_not_supported',
	SearchVideoNotInSameIndex = 'search_video_not_in_same_index',
	SearchVideoDurationTooLong = 'search_video_duration_too_long',
	SearchPageTokenExpired = 'search_page_token_expired'
}

export enum ClassifyErrorCode {
	ClassifyNotSupportedEngine = 'classify_not_supported_engine',
	ClassifyOptionCombinationNotSupported = 'classify_option_combination_not_supported',
	ClassifyPromptsLimitExceeded = 'classify_prompts_limit_exceeded',
	ClassifyPageTokenInvalid = 'classify_page_token_invalid',
	ClassifyPageTokenExpired = 'classify_page_token_expired'
}
