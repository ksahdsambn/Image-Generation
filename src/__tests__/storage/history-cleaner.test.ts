import { describe, it, expect, beforeEach } from 'vitest'
import { getDatabase } from '@/storage/database'
import { enforceHistoryLimits } from '@/storage/history-cleaner'
import type { HistoryRecord } from '@/types/history'

function createTestBlob(size = 512): Blob {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i++) data[i] = i % 256
  return new Blob([data], { type: 'image/png' })
}

async function insertTestRecord(overrides?: Partial<HistoryRecord>): Promise<void> {
  const db = getDatabase()
  await db.history.add({
    imageBlob: createTestBlob(),
    thumbnailBlob: createTestBlob(64),
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
    imageBytes: 512,
    createdAt: Date.now(),
    ...overrides,
  })
}

describe('数量自动清理', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('超过最大数量后会删除最旧记录', async () => {
    for (let i = 0; i < 55; i++) {
      await insertTestRecord({ prompt: `prompt ${i}`, createdAt: i * 1000, imageBytes: 100 })
    }

    const result = await enforceHistoryLimits()
    expect(result.deletedCount).toBe(5)

    const db = getDatabase()
    const count = await db.history.count()
    expect(count).toBeLessThanOrEqual(50)
  })

  it('最新记录不会被优先删除', async () => {
    for (let i = 0; i < 55; i++) {
      await insertTestRecord({ prompt: `prompt ${i}`, createdAt: i * 1000, imageBytes: 100 })
    }

    await enforceHistoryLimits()

    const db = getDatabase()
    const newest = await db.history.orderBy('createdAt').reverse().first()
    expect(newest).toBeDefined()
    expect(newest!.prompt).toBe('prompt 54')
  })

  it('不超过数量时不删除', async () => {
    for (let i = 0; i < 30; i++) {
      await insertTestRecord({ prompt: `prompt ${i}`, createdAt: i * 1000, imageBytes: 100 })
    }

    const result = await enforceHistoryLimits()
    expect(result.deletedCount).toBe(0)

    const db = getDatabase()
    expect(await db.history.count()).toBe(30)
  })

  it('清理后总量满足限制', async () => {
    for (let i = 0; i < 60; i++) {
      await insertTestRecord({ createdAt: i * 1000, imageBytes: 100 })
    }

    await enforceHistoryLimits()

    const db = getDatabase()
    expect(await db.history.count()).toBeLessThanOrEqual(50)
  })
})

describe('容量自动清理', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('超过最大容量后会删除最旧记录', async () => {
    for (let i = 0; i < 10; i++) {
      await insertTestRecord({ createdAt: i * 1000, imageBytes: 600000000 })
    }

    const result = await enforceHistoryLimits()
    expect(result.deletedCount).toBeGreaterThan(0)

    const db = getDatabase()
    const remaining = await db.history.toArray()
    let totalBytes = 0
    for (const r of remaining) totalBytes += r.imageBytes
    expect(totalBytes).toBeLessThanOrEqual(5368709120)
  })

  it('容量不超过时不删除', async () => {
    for (let i = 0; i < 5; i++) {
      await insertTestRecord({ createdAt: i * 1000, imageBytes: 1000 })
    }

    const result = await enforceHistoryLimits()
    expect(result.deletedCount).toBe(0)
  })
})

describe('空库清理', () => {
  it('空库清理不报错', async () => {
    const db = getDatabase()
    await db.history.clear()

    const result = await enforceHistoryLimits()
    expect(result.deletedCount).toBe(0)
  })
})
