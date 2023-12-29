export type FileType = {
	type: 'file'
	id: string
	data: File
	blobUrl: string
}

export type UrlType = {
	type: 'url'
	id: string
	url: string
	title: string
	thumbnailUrl: string
}

export type VideoType = FileType | UrlType

export const isFileType = (video: VideoType): video is FileType => video.type === 'file'
export const isUrlType = (video: VideoType): video is UrlType => video.type === 'url'
