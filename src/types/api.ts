export interface ImageResultItem {
  b64_json: string
  revised_prompt?: string
}

export interface ApiResponse {
  created?: number
  data: ImageResultItem[]
}

export type RequestMode = 'generations' | 'edits-multipart' | 'edits-json' | 'conflict'

export interface ParsedImageResult {
  blob: Blob
  mimeType: string
  revisedPrompt?: string
  objectUrl: string
}
