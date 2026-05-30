import type { ApiResponse, ParsedImageResult } from '@/types/api'
import type { OutputFormat } from '@/types/generation'
import { b64ToBlob, inferMimeType, createImageObjectUrl } from '@/utils/image-utils'

export function parseApiResponse(response: ApiResponse, outputFormat: OutputFormat): ParsedImageResult[] {
  if (!response.data || !Array.isArray(response.data)) {
    return []
  }

  return response.data.map((item) => {
    const mimeType = inferMimeType(outputFormat)
    const blob = b64ToBlob(item.b64_json, mimeType)
    const objectUrl = createImageObjectUrl(blob)

    return {
      blob,
      mimeType,
      revisedPrompt: item.revised_prompt,
      objectUrl,
    }
  })
}

export function releaseParsedResults(results: ParsedImageResult[]): void {
  for (const result of results) {
    if (result.objectUrl) {
      URL.revokeObjectURL(result.objectUrl)
    }
  }
}
