export type ImageHistoryRecord = {
  id: string
  imageBlob: Blob
  thumbnailBlob: Blob
  prompt: string
  params: Record<string, unknown>
  model: 'gpt-image-2'
  size: string
  quality?: string
  outputFormat: string
  createdAt: number
  byteSize: number
  revisedPrompt?: string
}

export type ImageHistoryListItem = Omit<ImageHistoryRecord, 'imageBlob'>

export type PersistedBlob = {
  type: string
  data: ArrayBuffer
}

export type StoredImageHistoryMetadata = Omit<ImageHistoryListItem, 'thumbnailBlob'> & {
  thumbnailBlob: PersistedBlob
}

export type StoredImageBlobRecord = {
  id: string
  imageBlob: PersistedBlob
}

export type ImageHistoryCreateInput = Omit<ImageHistoryRecord, 'id' | 'createdAt' | 'byteSize'>

export type HistoryQuery = {
  search?: string
  date?: string
  limit?: number
  offset?: number
}

export type HistoryLimits = {
  maxItems: number
  maxBytes: number
}
