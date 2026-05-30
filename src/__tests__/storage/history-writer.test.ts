import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDatabase } from '@/storage/database'
import { writeHistory, writeMultipleHistory, setThumbnailGenerator, resetThumbnailGenerator } from '@/storage/history-writer'

function createTestBlob(size = 512): Blob {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i++) data[i] = i % 256
  return new Blob([data], { type: 'image/png' })
}

describe('本地历史写入', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
    setThumbnailGenerator(async (blob: Blob) => blob)
  })

  afterEach(() => {
    resetThumbnailGenerator()
  })

  it('生成成功后写入历史', async () => {
    const result = await writeHistory({
      imageBlob: createTestBlob(),
      prompt: 'a cute cat',
      revisedPrompt: null,
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      background: 'auto',
      outputFormat: 'png',
      outputCompression: null,
      n: 1,
      requestMode: 'generations',
    })

    expect(result.success).toBe(true)
    const db = getDatabase()
    const count = await db.history.count()
    expect(count).toBe(1)
  })

  it('多张图片生成会写入多条记录', async () => {
    const meta = {
      prompt: 'a cute cat',
      revisedPrompt: null,
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      background: 'auto',
      outputFormat: 'png',
      outputCompression: null,
      n: 3,
      requestMode: 'generations',
    }

    const result = await writeMultipleHistory(
      [
        { imageBlob: createTestBlob(100), revisedPrompt: null },
        { imageBlob: createTestBlob(200), revisedPrompt: 'revised 1' },
        { imageBlob: createTestBlob(300), revisedPrompt: 'revised 2' },
      ],
      meta,
    )

    expect(result.successCount).toBe(3)
    expect(result.failureCount).toBe(0)
    const db = getDatabase()
    const count = await db.history.count()
    expect(count).toBe(3)
  })

  it('缩略图字段存在', async () => {
    const result = await writeHistory({
      imageBlob: createTestBlob(),
      prompt: 'test',
      revisedPrompt: null,
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      background: 'auto',
      outputFormat: 'png',
      outputCompression: null,
      n: 1,
      requestMode: 'generations',
    })

    expect(result.success).toBe(true)
    const db = getDatabase()
    const records = await db.history.toArray()
    expect(records.length).toBe(1)
    expect(records[0].thumbnailBlob).toBeDefined()
  })

  it('参数可完整恢复', async () => {
    await writeHistory({
      imageBlob: createTestBlob(),
      prompt: 'test prompt',
      revisedPrompt: 'revised prompt',
      model: 'gpt-image-2',
      size: '1536x1024',
      quality: 'high',
      background: 'transparent',
      outputFormat: 'webp',
      outputCompression: 80,
      n: 2,
      requestMode: 'edits-multipart',
    })

    const db = getDatabase()
    const record = await db.history.toCollection().first()
    expect(record).toBeDefined()
    expect(record!.prompt).toBe('test prompt')
    expect(record!.revisedPrompt).toBe('revised prompt')
    expect(record!.model).toBe('gpt-image-2')
    expect(record!.size).toBe('1536x1024')
    expect(record!.quality).toBe('high')
    expect(record!.background).toBe('transparent')
    expect(record!.outputFormat).toBe('webp')
    expect(record!.outputCompression).toBe(80)
    expect(record!.n).toBe(2)
    expect(record!.requestMode).toBe('edits-multipart')
    expect(record!.imageBytes).toBeGreaterThan(0)
    expect(record!.createdAt).toBeGreaterThan(0)
  })

  it('imageBytes 记录正确', async () => {
    const blob = createTestBlob(2048)
    await writeHistory({
      imageBlob: blob,
      prompt: 'test',
      revisedPrompt: null,
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      background: 'auto',
      outputFormat: 'png',
      outputCompression: null,
      n: 1,
      requestMode: 'generations',
    })

    const db = getDatabase()
    const record = await db.history.toCollection().first()
    expect(record!.imageBytes).toBe(2048)
  })

  it('写入失败时返回错误但不抛异常', async () => {
    setThumbnailGenerator(async (blob: Blob) => blob)

    const db = getDatabase()
    const originalAdd = db.history.add.bind(db.history)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.history.add = (async () => { throw new Error('IndexedDB write failed') }) as any

    const result = await writeHistory({
      imageBlob: createTestBlob(),
      prompt: 'test',
      revisedPrompt: null,
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'auto',
      background: 'auto',
      outputFormat: 'png',
      outputCompression: null,
      n: 1,
      requestMode: 'generations',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error!.code).toBe('STORAGE_ERROR')

    db.history.add = originalAdd
  })
})
