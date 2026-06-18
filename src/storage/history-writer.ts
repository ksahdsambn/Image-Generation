import { getDatabase, isIndexedDBAvailable } from '@/storage/database'
import type { HistoryRecord } from '@/types/history'
import { classifyStorageError, type AppError } from '@/types/errors'
import { translateValidation } from '@/i18n'

const THUMBNAIL_MAX_SIZE = 256
const THUMBNAIL_MIME = 'image/png'

export async function generateThumbnail(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(imageBlob)
      return
    }

    const url = URL.createObjectURL(imageBlob)
    const img = new Image()

    const timer = setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve(imageBlob)
    }, 5000)

    img.onload = () => {
      clearTimeout(timer)
      try {
        let w = img.width
        let h = img.height
        if (w === 0 || h === 0) {
          URL.revokeObjectURL(url)
          resolve(imageBlob)
          return
        }
        if (w > THUMBNAIL_MAX_SIZE || h > THUMBNAIL_MAX_SIZE) {
          const ratio = Math.min(THUMBNAIL_MAX_SIZE / w, THUMBNAIL_MAX_SIZE / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          resolve(imageBlob)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            resolve(blob || imageBlob)
          },
          THUMBNAIL_MIME,
          0.7,
        )
      } catch {
        URL.revokeObjectURL(url)
        resolve(imageBlob)
      }
    }
    img.onerror = () => {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(imageBlob)
    }
    img.src = url
  })
}

export type ThumbnailGenerator = (imageBlob: Blob) => Promise<Blob>

let _thumbnailGenerator: ThumbnailGenerator = generateThumbnail

export function setThumbnailGenerator(gen: ThumbnailGenerator): void {
  _thumbnailGenerator = gen
}

export function resetThumbnailGenerator(): void {
  _thumbnailGenerator = generateThumbnail
}

export interface WriteHistoryParams {
  imageBlob: Blob
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
}

export async function writeHistory(params: WriteHistoryParams): Promise<{ success: boolean; error?: AppError }> {
  const available = await isIndexedDBAvailable()
  if (!available) {
    return { success: false, error: classifyStorageError(new Error(translateValidation('storageUnavailableShort'))) }
  }

  try {
    const db = getDatabase()
    const imageBytes = params.imageBlob.size
    let thumbnailBlob: Blob | null = null

    try {
      thumbnailBlob = await _thumbnailGenerator(params.imageBlob)
    } catch {
      thumbnailBlob = null
    }

    const record: HistoryRecord = {
      imageBlob: params.imageBlob,
      thumbnailBlob,
      prompt: params.prompt,
      revisedPrompt: params.revisedPrompt,
      model: params.model,
      size: params.size,
      quality: params.quality,
      background: params.background,
      outputFormat: params.outputFormat,
      outputCompression: params.outputCompression,
      n: params.n,
      requestMode: params.requestMode,
      imageBytes,
      createdAt: Date.now(),
    }

    await db.history.add(record)
    return { success: true }
  } catch (error) {
    const appError = classifyStorageError(error instanceof Error ? error : new Error(String(error)))
    return { success: false, error: appError }
  }
}

export async function writeMultipleHistory(
  images: Array<{
    imageBlob: Blob
    revisedPrompt: string | null
  }>,
  meta: Omit<WriteHistoryParams, 'imageBlob' | 'revisedPrompt'>,
): Promise<{ successCount: number; failureCount: number; errors: AppError[] }> {
  let successCount = 0
  let failureCount = 0
  const errors: AppError[] = []

  for (const image of images) {
    const result = await writeHistory({
      ...meta,
      imageBlob: image.imageBlob,
      revisedPrompt: image.revisedPrompt,
    })
    if (result.success) {
      successCount++
    } else {
      failureCount++
      if (result.error) errors.push(result.error)
    }
  }

  return { successCount, failureCount, errors }
}
