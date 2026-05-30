import type { ImageApiResult } from '@/services/imageApi'
import type { ImageOutputFormat } from '@/types/generation'

export type ImageMimeType = 'image/png' | 'image/webp' | 'image/jpeg'

export type ConvertedImageResult = {
  id: string
  blob: Blob
  mimeType: ImageMimeType
  extension: ImageOutputFormat
  fileName: string
  revisedPrompt?: string
}

export type PreviewImageResult = ConvertedImageResult & {
  objectUrl: string
}

const MIME_BY_FORMAT: Record<ImageOutputFormat, ImageMimeType> = {
  png: 'image/png',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
}

const FORMAT_BY_MIME: Record<ImageMimeType, ImageOutputFormat> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpeg',
}

const SIGNATURES: Array<{ bytes: number[]; mimeType: ImageMimeType }> = [
  { bytes: [0x89, 0x50, 0x4e, 0x47], mimeType: 'image/png' },
  { bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' },
]

export function inferImageMimeType(bytes: Uint8Array, fallbackFormat: ImageOutputFormat): ImageMimeType {
  const signature = SIGNATURES.find(({ bytes: signatureBytes }) =>
    signatureBytes.every((byte, index) => bytes[index] === byte),
  )

  return signature?.mimeType ?? MIME_BY_FORMAT[fallbackFormat]
}

export function getImageExtension(mimeType: ImageMimeType): ImageOutputFormat {
  return FORMAT_BY_MIME[mimeType]
}

export function base64ToBlob(b64Json: string, fallbackFormat: ImageOutputFormat): { blob: Blob; mimeType: ImageMimeType } {
  const normalized = b64Json.includes(',') ? b64Json.split(',').at(-1) ?? '' : b64Json
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  const mimeType = inferImageMimeType(bytes, fallbackFormat)
  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
  }
}

export function convertApiResultsToImages(
  results: ImageApiResult[],
  outputFormat: ImageOutputFormat,
  createdAt = Date.now(),
): ConvertedImageResult[] {
  return results.map((result, index) => {
    const { blob, mimeType } = base64ToBlob(result.b64Json, outputFormat)
    const extension = getImageExtension(mimeType)
    const sequence = String(index + 1).padStart(2, '0')

    return {
      id: `${createdAt}-${sequence}`,
      blob,
      mimeType,
      extension,
      fileName: `gpt-image-2-${createdAt}-${sequence}.${extension}`,
      ...(result.revisedPrompt ? { revisedPrompt: result.revisedPrompt } : {}),
    }
  })
}

export function createPreviewImages(
  images: ConvertedImageResult[],
  createObjectUrl: (blob: Blob) => string = URL.createObjectURL,
): PreviewImageResult[] {
  return images.map((image) => ({
    ...image,
    objectUrl: createObjectUrl(image.blob),
  }))
}

export function revokePreviewImages(
  images: Pick<PreviewImageResult, 'objectUrl'>[],
  revokeObjectUrl: (url: string) => void = URL.revokeObjectURL,
) {
  images.forEach((image) => revokeObjectUrl(image.objectUrl))
}

export function downloadBlob(blob: Blob, fileName: string, documentRef: Document = document) {
  const url = URL.createObjectURL(blob)
  const link = documentRef.createElement('a')

  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  documentRef.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function copyImageToClipboard(blob: Blob, clipboard: Clipboard | undefined = navigator.clipboard) {
  if (!clipboard) {
    throw new Error('Clipboard is unavailable.')
  }

  const clipboardWithItems = clipboard as Clipboard & {
    write?: (items: ClipboardItem[]) => Promise<void>
    writeText?: (text: string) => Promise<void>
  }

  if (typeof ClipboardItem !== 'undefined' && typeof clipboardWithItems.write === 'function') {
    await clipboardWithItems.write([new ClipboardItem({ [blob.type]: blob })])
    return 'image'
  }

  if (typeof clipboardWithItems.writeText === 'function') {
    const dataUrl = await blobToDataUrl(blob)
    await clipboardWithItems.writeText(dataUrl)
    return 'data-url'
  }

  throw new Error('Clipboard write is unavailable.')
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image.'))
    reader.readAsDataURL(blob)
  })
}
