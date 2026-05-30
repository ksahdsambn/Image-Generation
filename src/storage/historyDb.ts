import Dexie, { type Table } from 'dexie'
import { getRuntimeConfig } from '@/config/appConfig'
import type { ConvertedImageResult } from '@/utils/imageResult'
import type { NormalizedGenerationParams } from '@/types/generation'
import type {
  HistoryLimits,
  HistoryQuery,
  ImageHistoryCreateInput,
  ImageHistoryListItem,
  ImageHistoryRecord,
  PersistedBlob,
  StoredImageBlobRecord,
  StoredImageHistoryMetadata,
} from '@/types/history'

export const HISTORY_DB_NAME = 'gpt-image-2-local-gallery'
export const HISTORY_DB_VERSION = 1
export const DEFAULT_HISTORY_PAGE_SIZE = 20

export class ImageHistoryDatabase extends Dexie {
  history!: Table<StoredImageHistoryMetadata, string>
  images!: Table<StoredImageBlobRecord, string>

  constructor(name = HISTORY_DB_NAME) {
    super(name)
    this.version(HISTORY_DB_VERSION).stores({
      history: '&id, createdAt, prompt, outputFormat, size, byteSize',
      images: '&id',
    })
  }
}

export const historyDb = new ImageHistoryDatabase()

export type ThumbnailFactory = (blob: Blob, outputFormat: string) => Promise<Blob>

export async function isHistoryDbAvailable(db: ImageHistoryDatabase = historyDb): Promise<boolean> {
  try {
    await db.open()
    return true
  } catch {
    return false
  }
}

export async function addHistoryRecord(
  input: ImageHistoryCreateInput,
  options: {
    db?: ImageHistoryDatabase
    id?: string
    createdAt?: number
    limits?: HistoryLimits
  } = {},
): Promise<ImageHistoryRecord> {
  const db = options.db ?? historyDb
  const createdAt = options.createdAt ?? Date.now()
  const id = options.id ?? createHistoryId(createdAt)
  const byteSize = input.imageBlob.size
  const record: ImageHistoryRecord = {
    ...input,
    id,
    createdAt,
    byteSize,
  }
  const metadata = await toMetadata(record)
  const imageBlob = await persistBlob(input.imageBlob)

  await db.transaction('rw', db.history, db.images, async () => {
    await db.history.put(metadata)
    await db.images.put({ id, imageBlob })
  })

  await enforceHistoryLimits(options.limits ?? getConfiguredHistoryLimits(), db)

  return record
}

export async function saveGeneratedImagesToHistory(
  images: ConvertedImageResult[],
  params: NormalizedGenerationParams,
  options: {
    db?: ImageHistoryDatabase
    limits?: HistoryLimits
    thumbnailFactory?: ThumbnailFactory
    createdAt?: number
  } = {},
): Promise<ImageHistoryRecord[]> {
  const thumbnailFactory = options.thumbnailFactory ?? createThumbnailBlob
  const createdAt = options.createdAt ?? Date.now()
  const saved: ImageHistoryRecord[] = []

  for (const [index, image] of images.entries()) {
    const thumbnailBlob = await thumbnailFactory(image.blob, image.extension)
    const record = await addHistoryRecord(
      {
        imageBlob: image.blob,
        thumbnailBlob,
        prompt: params.prompt,
        params: serializeGenerationParams(params),
        model: params.model,
        size: params.size,
        quality: params.quality,
        outputFormat: image.extension,
        ...(image.revisedPrompt ? { revisedPrompt: image.revisedPrompt } : {}),
      },
      {
        db: options.db,
        id: `${createdAt}-${String(index + 1).padStart(2, '0')}`,
        createdAt: createdAt + index,
        limits: options.limits,
      },
    )
    saved.push(record)
  }

  return saved
}

export async function getHistoryRecord(id: string, db: ImageHistoryDatabase = historyDb): Promise<ImageHistoryRecord | null> {
  const [metadata, image] = await Promise.all([db.history.get(id), db.images.get(id)])

  if (!metadata || !image) {
    return null
  }

  return {
    ...fromMetadata(metadata),
    imageBlob: restoreBlob(image.imageBlob),
  }
}

export async function listHistory(
  query: HistoryQuery = {},
  db: ImageHistoryDatabase = historyDb,
): Promise<ImageHistoryListItem[]> {
  const limit = query.limit ?? DEFAULT_HISTORY_PAGE_SIZE
  const offset = query.offset ?? 0
  const search = query.search?.trim().toLowerCase() ?? ''
  const dateRange = query.date ? getLocalDateRange(query.date) : null
  const metadata = await db.history.orderBy('createdAt').reverse().toArray()

  return metadata
    .filter((record) => {
      const matchesSearch = !search || record.prompt.toLowerCase().includes(search)
      const matchesDate =
        !dateRange || (record.createdAt >= dateRange.start && record.createdAt < dateRange.end)
      return matchesSearch && matchesDate
    })
    .slice(offset, offset + limit)
    .map(fromMetadata)
}

export async function deleteHistoryRecord(id: string, db: ImageHistoryDatabase = historyDb) {
  await db.transaction('rw', db.history, db.images, async () => {
    await db.history.delete(id)
    await db.images.delete(id)
  })
}

export async function clearHistory(db: ImageHistoryDatabase = historyDb) {
  await db.transaction('rw', db.history, db.images, async () => {
    await db.history.clear()
    await db.images.clear()
  })
}

export async function countHistory(db: ImageHistoryDatabase = historyDb): Promise<number> {
  return db.history.count()
}

export async function getHistoryByteSize(db: ImageHistoryDatabase = historyDb): Promise<number> {
  const records = await db.history.toArray()
  return records.reduce((sum, record) => sum + record.byteSize, 0)
}

export async function enforceHistoryLimits(limits: HistoryLimits, db: ImageHistoryDatabase = historyDb) {
  const records = await db.history.orderBy('createdAt').toArray()
  const deleteIds = new Set<string>()
  let remaining = [...records]

  while (remaining.length > limits.maxItems) {
    const [oldest, ...rest] = remaining
    deleteIds.add(oldest.id)
    remaining = rest
  }

  let totalBytes = remaining.reduce((sum, record) => sum + record.byteSize, 0)
  while (totalBytes > limits.maxBytes && remaining.length > 0) {
    const [oldest, ...rest] = remaining
    deleteIds.add(oldest.id)
    totalBytes -= oldest.byteSize
    remaining = rest
  }

  if (deleteIds.size === 0) {
    return
  }

  await db.transaction('rw', db.history, db.images, async () => {
    await db.history.bulkDelete([...deleteIds])
    await db.images.bulkDelete([...deleteIds])
  })
}

export async function createThumbnailBlob(blob: Blob, outputFormat: string): Promise<Blob> {
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
    return blob
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    return blob
  }

  const canvas = document.createElement('canvas')
  const maxSide = 320
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    return blob
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob((thumbnail) => resolve(thumbnail ?? blob), outputFormat === 'png' ? 'image/png' : 'image/webp', 0.82)
  })
}

export function serializeGenerationParams(params: NormalizedGenerationParams): Record<string, unknown> {
  return {
    model: params.model,
    response_format: params.response_format,
    prompt: params.prompt,
    size: params.size,
    n: params.n,
    quality: params.quality,
    background: params.background,
    output_format: params.output_format,
    ...(params.output_compression === undefined ? {} : { output_compression: params.output_compression }),
    imageUrls: [...params.imageUrls],
    hasReferenceImages: params.referenceImages.length > 0,
    hasMaskImage: Boolean(params.maskImage),
    maskImageUrl: params.maskImageUrl,
  }
}

async function toMetadata(record: ImageHistoryRecord): Promise<StoredImageHistoryMetadata> {
  const { imageBlob: _imageBlob, ...metadata } = record
  return {
    ...metadata,
    thumbnailBlob: await persistBlob(record.thumbnailBlob),
  }
}

function fromMetadata(metadata: StoredImageHistoryMetadata): ImageHistoryListItem {
  return {
    ...metadata,
    thumbnailBlob: restoreBlob(metadata.thumbnailBlob),
  }
}

async function persistBlob(blob: Blob): Promise<PersistedBlob> {
  return {
    type: blob.type,
    data: await blob.arrayBuffer(),
  }
}

function restoreBlob(blob: PersistedBlob): Blob {
  return new Blob([blob.data], { type: blob.type })
}

function createHistoryId(createdAt: number): string {
  return `${createdAt}-${crypto.randomUUID()}`
}

function getConfiguredHistoryLimits(): HistoryLimits {
  const runtimeConfig = getRuntimeConfig()
  return {
    maxItems: runtimeConfig.config.historyMaxItems,
    maxBytes: runtimeConfig.config.historyMaxBytes,
  }
}

function getLocalDateRange(date: string): { start: number; end: number } {
  const [year, month, day] = date.split('-').map(Number)
  const start = new Date(year, month - 1, day).getTime()
  const end = new Date(year, month - 1, day + 1).getTime()
  return { start, end }
}
