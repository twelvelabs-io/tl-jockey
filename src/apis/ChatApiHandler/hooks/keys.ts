const USAGE = 'usage'

export function getUsageKey(): [typeof USAGE] {
	return [USAGE]
}

const ACCOUNT = 'account'

export function getAccountAccessLimitKey(): [typeof ACCOUNT, 'access_limit'] {
	return [ACCOUNT, 'access_limit']
}

const YOUTUBE_METADATA = 'youtube_metadata'

export function getYoutubeMetadataKey(url: string): [typeof YOUTUBE_METADATA, string] {
	return [YOUTUBE_METADATA, url]
}
