import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDatabase, DB_NAME, DB_VERSION, isIndexedDBAvailable } from '@/storage/database'
import type { HistoryRecord } from '@/types/history'

function createTestBlob(size = 1024): Blob {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i++) data[i] = i % 256
  return new Blob([data], { type: 'image/png' })
}

function createTestRecord(overrides?: Partial<HistoryRecord>): HistoryRecord {
  return {
    imageBlob: createTestBlob(512),
    thumbnailBlob: createTestBlob(64),
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
    imageBytes: 512,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('IndexedDB 数据库初始化', () => {
  afterEach(async () => {
    const db = getDatabase()
    if (db.isOpen()) {
      await db.history.clear()
    }
  })

  it('数据库可初始化', async () => {
    const db = getDatabase()
    expect(db).toBeDefined()
    await db.open()
    expect(db.isOpen()).toBe(true)
  })

  it('数据库名称使用项目专属名称', () => {
    expect(DB_NAME).toBe('gpt-image-2-studio')
  })

  it('数据库版本号存在且可识别', () => {
    expect(DB_VERSION).toBeGreaterThanOrEqual(1)
    expect(typeof DB_VERSION).toBe('number')
  })

  it('history 表存在', () => {
    const db = getDatabase()
    expect(db.history).toBeDefined()
  })
})

describe('IndexedDB 写入和读取完整字段', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('写入记录后可读取完整字段', async () => {
    const db = getDatabase()
    const record = createTestRecord()
    const id = await db.history.add(record)
    expect(id).toBeGreaterThan(0)

    const read = await db.history.get(id)
    expect(read).toBeDefined()
    expect(read!.prompt).toBe('a cute cat')
    expect(read!.model).toBe('gpt-image-2')
    expect(read!.size).toBe('1024x1024')
    expect(read!.quality).toBe('auto')
    expect(read!.background).toBe('auto')
    expect(read!.outputFormat).toBe('png')
    expect(read!.outputCompression).toBeNull()
    expect(read!.n).toBe(1)
    expect(read!.requestMode).toBe('generations')
    expect(read!.imageBytes).toBe(512)
    expect(read!.createdAt).toBeGreaterThan(0)
  })

  it('Blob 字段能正确保存和读取', async () => {
    const db = getDatabase()
    const imageBlob = createTestBlob(2048)
    const thumbnailBlob = createTestBlob(128)
    const record = createTestRecord({ imageBlob, thumbnailBlob, imageBytes: 2048 })
    const id = await db.history.add(record)

    const read = await db.history.get(id)
    expect(read).toBeDefined()
    expect(read!.imageBlob).toBeDefined()
    expect(read!.thumbnailBlob).toBeDefined()
    expect(read!.imageBytes).toBe(2048)
  })

  it('thumbnailBlob 为 null 时能正确保存', async () => {
    const db = getDatabase()
    const record = createTestRecord({ thumbnailBlob: null })
    const id = await db.history.add(record)

    const read = await db.history.get(id)
    expect(read).toBeDefined()
    expect(read!.thumbnailBlob).toBeNull()
  })

  it('revisedPrompt 能保存和读取', async () => {
    const db = getDatabase()
    const record = createTestRecord({ revisedPrompt: 'A revised prompt for the cat image' })
    const id = await db.history.add(record)

    const read = await db.history.get(id)
    expect(read).toBeDefined()
    expect(read!.revisedPrompt).toBe('A revised prompt for the cat image')
  })
})

describe('IndexedDB 记录安全检查', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('记录中不存在 apiKey 字段', async () => {
    const record = createTestRecord()
    const serialized = JSON.parse(JSON.stringify({ ...record, imageBlob: '[Blob]', thumbnailBlob: '[Blob]' }))
    expect('apiKey' in serialized).toBe(false)
    expect('api_key' in serialized).toBe(false)
    expect('authorization' in serialized).toBe(false)
  })

  it('写入并读取的记录中不包含 API Key', async () => {
    const db = getDatabase()
    const record = createTestRecord()
    const id = await db.history.add(record)
    const read = await db.history.get(id)

    const keys = Object.keys(read!)
    for (const key of keys) {
      expect(key.toLowerCase()).not.toContain('apikey')
      expect(key.toLowerCase()).not.toContain('api_key')
      expect(key.toLowerCase()).not.toContain('authorization')
      expect(key.toLowerCase()).not.toContain('bearer')
    }
  })

  it('记录中的 model 字段固定为 gpt-image-2', async () => {
    const db = getDatabase()
    const record = createTestRecord()
    const id = await db.history.add(record)
    const read = await db.history.get(id)
    expect(read!.model).toBe('gpt-image-2')
  })
})

describe('IndexedDB 可用性检测', () => {
  it('isIndexedDBAvailable 返回 true', async () => {
    const available = await isIndexedDBAvailable()
    expect(available).toBe(true)
  })
})
