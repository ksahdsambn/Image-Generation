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
