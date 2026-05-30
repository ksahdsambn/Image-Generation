import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addHistoryRecord,
  clearHistory,
  countHistory,
  createThumbnailBlob,
  deleteHistoryRecord,
  enforceHistoryLimits,
  getHistoryByteSize,
  getHistoryRecord,
  ImageHistoryDatabase,
  isHistoryDbAvailable,
  listHistory,
  saveGeneratedImagesToHistory,
  serializeGenerationParams,
} from '@/storage/historyDb'
import { IMAGE_MODEL, IMAGE_RESPONSE_FORMAT, type NormalizedGenerationParams } from '@/types/generation'
import type { ConvertedImageResult } from '@/utils/imageResult'

const baseParams: NormalizedGenerationParams = {
  model: IMAGE_MODEL,
  response_format: IMAGE_RESPONSE_FORMAT,
  prompt: 'A local gallery test',
  size: '1024x1024',
  n: 1,
  quality: 'auto',
  background: 'auto',
  output_format: 'webp',
  output_compression: 80,
  referenceImages: [],
  imageUrls: [],
  maskImage: null,
  maskImageUrl: '',
}

function createDb() {
  return new ImageHistoryDatabase(`test-gallery-${crypto.randomUUID()}`)
}

function createBlob(size: number, type = 'image/png') {
  return new Blob([new Uint8Array(size)], { type })
}

function createConvertedImage(id: string, size = 4): ConvertedImageResult {
  return {
    id,
    blob: createBlob(size),
    mimeType: 'image/png',
    extension: 'png',
    fileName: `${id}.png`,
  }
}

async function addRecord(db: ImageHistoryDatabase, id: string, createdAt: number, prompt = `Prompt ${id}`, size = 4) {
  return addHistoryRecord(
    {
      imageBlob: createBlob(size),
      thumbnailBlob: createBlob(1),
      prompt,
      params: { prompt, model: 'gpt-image-2' },
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      outputFormat: 'png',
    },
    {
      db,
      id,
      createdAt,
      limits: { maxItems: 100, maxBytes: 100_000 },
    },
  )
}

describe('history IndexedDB storage', () => {
  let db: ImageHistoryDatabase

  beforeEach(() => {
    db = createDb()
  })

  afterEach(async () => {
    db.close()
    await Dexie.delete(db.name)
  })

  it('initializes the Dexie database with a versioned schema', async () => {
    expect(await isHistoryDbAvailable(db)).toBe(true)
    expect(db.verno).toBe(1)
    expect(db.tables.map((table) => table.name).sort()).toEqual(['history', 'images'])
  })

  it('writes and reads a complete record including Blob fields', async () => {
    await addRecord(db, 'record-1', 1000)

    const record = await getHistoryRecord('record-1', db)

    expect(record).toMatchObject({
      id: 'record-1',
      prompt: 'Prompt record-1',
      model: 'gpt-image-2',
      outputFormat: 'png',
      byteSize: 4,
    })
    expect(record?.imageBlob).toBeInstanceOf(Blob)
    expect(record?.thumbnailBlob).toBeInstanceOf(Blob)
  })

  it('does not save API Key or Authorization data in serialized params or records', async () => {
    await addHistoryRecord(
      {
        imageBlob: createBlob(4),
        thumbnailBlob: createBlob(1),
        prompt: 'Sensitive check',
        params: serializeGenerationParams(baseParams),
        model: 'gpt-image-2',
        size: '1024x1024',
        quality: 'auto',
        outputFormat: 'png',
      },
      { db, id: 'safe', createdAt: 1000, limits: { maxItems: 10, maxBytes: 1000 } },
    )

    const record = await getHistoryRecord('safe', db)
    const serialized = JSON.stringify(record)

    expect(serialized).not.toContain('apiKey')
    expect(serialized).not.toContain('Authorization')
    expect(serialized).not.toContain('Bearer')
    expect(serialized).not.toContain('sk-test')
  })

  it('saves generated image results as separate history records with thumbnails', async () => {
    const thumbnailFactory = vi.fn().mockResolvedValue(createBlob(1, 'image/webp'))
    const saved = await saveGeneratedImagesToHistory(
      [createConvertedImage('one'), createConvertedImage('two')],
      baseParams,
      {
        db,
        thumbnailFactory,
        createdAt: 2000,
        limits: { maxItems: 10, maxBytes: 1000 },
      },
    )

    expect(saved).toHaveLength(2)
    expect(thumbnailFactory).toHaveBeenCalledTimes(2)
    expect(await countHistory(db)).toBe(2)
    expect((await listHistory({ limit: 10 }, db)).map((item) => item.id)).toEqual(['2000-02', '2000-01'])
  })

  it('keeps the original image when thumbnail decoding is unavailable', async () => {
    const source = createBlob(4)
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode failed')))

    const thumbnail = await createThumbnailBlob(source, 'png')

    expect(thumbnail).toBe(source)
    vi.unstubAllGlobals()
  })

  it('lists history in reverse chronological pages without loading full image blobs', async () => {
    await addRecord(db, 'old', 1000)
    await addRecord(db, 'new', 2000)

    const page = await listHistory({ limit: 1, offset: 0 }, db)

    expect(page).toHaveLength(1)
    expect(page[0].id).toBe('new')
    expect('imageBlob' in page[0]).toBe(false)
    expect(page[0].thumbnailBlob).toBeInstanceOf(Blob)
  })

  it('searches Prompt text case-insensitively', async () => {
    await addRecord(db, 'one', 1000, 'Studio portrait')
    await addRecord(db, 'two', 2000, 'Landscape')

    const results = await listHistory({ search: 'studio', limit: 10 }, db)

    expect(results.map((item) => item.id)).toEqual(['one'])
  })

  it('filters records by local date', async () => {
    await addRecord(db, 'jan-1', new Date(2026, 0, 1, 9).getTime())
    await addRecord(db, 'jan-2', new Date(2026, 0, 2, 9).getTime())

    const results = await listHistory({ date: '2026-01-01', limit: 10 }, db)

    expect(results.map((item) => item.id)).toEqual(['jan-1'])
  })

  it('deletes one record and clears all history without touching other storage namespaces', async () => {
    sessionStorage.setItem('gpt-image-2-api-key', 'sk-session')
    await addRecord(db, 'delete-me', 1000)
    await addRecord(db, 'keep-me', 2000)

    await deleteHistoryRecord('delete-me', db)
    expect(await getHistoryRecord('delete-me', db)).toBeNull()
    expect(await countHistory(db)).toBe(1)

    await clearHistory(db)
    expect(await countHistory(db)).toBe(0)
    expect(sessionStorage.getItem('gpt-image-2-api-key')).toBe('sk-session')
  })

  it('enforces maximum item count by deleting oldest records', async () => {
    await addRecord(db, 'old', 1000)
    await addRecord(db, 'middle', 2000)
    await addRecord(db, 'new', 3000)

    await enforceHistoryLimits({ maxItems: 2, maxBytes: 1000 }, db)

    expect((await listHistory({ limit: 10 }, db)).map((item) => item.id)).toEqual(['new', 'middle'])
    expect(await getHistoryRecord('old', db)).toBeNull()
  })

  it('enforces maximum capacity by deleting oldest records until under the byte limit', async () => {
    await addRecord(db, 'old', 1000, 'old', 6)
    await addRecord(db, 'middle', 2000, 'middle', 6)
    await addRecord(db, 'new', 3000, 'new', 6)

    await enforceHistoryLimits({ maxItems: 10, maxBytes: 12 }, db)

    expect(await getHistoryByteSize(db)).toBeLessThanOrEqual(12)
    expect((await listHistory({ limit: 10 }, db)).map((item) => item.id)).toEqual(['new', 'middle'])
  })

  it('returns unavailable when IndexedDB open fails', async () => {
    const brokenDb = {
      open: vi.fn().mockRejectedValue(new Error('blocked')),
    } as unknown as ImageHistoryDatabase

    await expect(isHistoryDbAvailable(brokenDb)).resolves.toBe(false)
  })
})
