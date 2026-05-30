import type { OutputFormat } from '@/types/generation'

const MIME_MAP: Record<OutputFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
}

const EXT_MAP: Record<OutputFormat, string> = {
  png: '.png',
  webp: '.webp',
  jpeg: '.jpg',
}

export function inferMimeType(format: OutputFormat): string {
  return MIME_MAP[format] || 'image/png'
}

export function inferFileExtension(format: OutputFormat): string {
  return EXT_MAP[format] || '.png'
}

export function b64ToBlob(b64: string, mimeType: string): Blob {
  const binaryStr = atob(b64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export function createImageObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function revokeImageObjectUrl(objectUrl: string): void {
  try {
    URL.revokeObjectURL(objectUrl)
  } catch {
    // silent fail
  }
}

export function generateFilename(format: OutputFormat, index: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const ext = inferFileExtension(format)
  return `gpt-image-${timestamp}-${index + 1}${ext}`
}
