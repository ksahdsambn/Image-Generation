export interface HistoryRecord {
  id?: number
  imageBlob: Blob
  thumbnailBlob: Blob | null
  prompt: string
  revisedPrompt: string | null
  model: string
  size: string
  quality: string
  background: string
  outputFormat: string
  outputCompression: number | null
  n: number
  requestMode: string
  imageBytes: number
  createdAt: number
}

export interface HistoryQueryParams {
  page?: number
  pageSize?: number
  searchText?: string
  startDate?: number | null
  endDate?: number | null
}

export interface HistoryQueryResult {
  records: HistoryRecord[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
