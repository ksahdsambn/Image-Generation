import { describe, it, expect, beforeEach } from 'vitest'
import { getDatabase } from '@/storage/database'
import { queryHistory, getHistoryById, getHistoryCount, getTotalBytes } from '@/storage/history-reader'
import type { HistoryRecord } from '@/types/history'

function createTestBlob(size = 512): Blob {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i++) data[i] = i % 256
  return new Blob([data], { type: 'image/png' })
}

async function insertTestRecord(overrides?: Partial<HistoryRecord>): Promise<number> {
  const db = getDatabase()
  const record: HistoryRecord = {
    imageBlob: createTestBlob(),
    thumbnailBlob: createTestBlob(64),
    prompt: 'test prompt',
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
  const id = await db.history.add(record)
  return id!
}

describe('历史倒序读取', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('历史按时间倒序展示', async () => {
    await insertTestRecord({ prompt: 'oldest', createdAt: 1000 })
    await insertTestRecord({ prompt: 'middle', createdAt: 2000 })
    await insertTestRecord({ prompt: 'newest', createdAt: 3000 })

    const result = await queryHistory()
    expect(result.records.length).toBe(3)
    expect(result.records[0].prompt).toBe('newest')
    expect(result.records[1].prompt).toBe('middle')
    expect(result.records[2].prompt).toBe('oldest')
  })

  it('默认展示最近记录', async () => {
    for (let i = 0; i < 30; i++) {
      await insertTestRecord({ prompt: `prompt ${i}`, createdAt: i * 1000 })
    }

    const result = await queryHistory()
    expect(result.records.length).toBe(20)
    expect(result.records[0].prompt).toBe('prompt 29')
  })
})

describe('历史分页', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('分页读取不会一次返回全部记录', async () => {
    for (let i = 0; i < 25; i++) {
      await insertTestRecord({ prompt: `prompt ${i}`, createdAt: i * 1000 })
    }

    const page1 = await queryHistory({ page: 1, pageSize: 10 })
    expect(page1.records.length).toBe(10)
    expect(page1.total).toBe(25)
    expect(page1.hasMore).toBe(true)
    expect(page1.page).toBe(1)

    const page2 = await queryHistory({ page: 2, pageSize: 10 })
    expect(page2.records.length).toBe(10)
    expect(page2.hasMore).toBe(true)

    const page3 = await queryHistory({ page: 3, pageSize: 10 })
    expect(page3.records.length).toBe(5)
    expect(page3.hasMore).toBe(false)
  })

  it('空历史返回空结果', async () => {
    const result = await queryHistory()
    expect(result.records.length).toBe(0)
    expect(result.total).toBe(0)
    expect(result.hasMore).toBe(false)
  })
})

describe('历史搜索', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('搜索 Prompt 能返回匹配记录', async () => {
    await insertTestRecord({ prompt: 'a cute cat on the sofa' })
    await insertTestRecord({ prompt: 'a dog running in the park' })
    await insertTestRecord({ prompt: 'a cat sleeping' })

    const result = await queryHistory({ searchText: 'cat' })
    expect(result.records.length).toBe(2)
    expect(result.total).toBe(2)
  })

  it('未命中搜索返回空', async () => {
    await insertTestRecord({ prompt: 'a cute cat' })

    const result = await queryHistory({ searchText: 'dragon' })
    expect(result.records.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('空搜索文本返回全部', async () => {
    await insertTestRecord({ prompt: 'cat' })
    await insertTestRecord({ prompt: 'dog' })

    const result = await queryHistory({ searchText: '' })
    expect(result.records.length).toBe(2)
  })

  it('搜索不区分大小写', async () => {
    await insertTestRecord({ prompt: 'Beautiful Sunset' })

    const result = await queryHistory({ searchText: 'beautiful' })
    expect(result.records.length).toBe(1)
  })
})

describe('日期筛选', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('同日筛选正确', async () => {
    const dayStart = new Date(2026, 0, 15).getTime()
    await insertTestRecord({ prompt: 'day 1', createdAt: dayStart })
    await insertTestRecord({ prompt: 'day 2', createdAt: dayStart + 3600000 })
    await insertTestRecord({ prompt: 'day 3', createdAt: dayStart + 86400000 })

    const result = await queryHistory({ startDate: dayStart, endDate: dayStart + 86400000 - 1 })
    expect(result.records.length).toBe(2)
    expect(result.total).toBe(2)
  })

  it('跨日筛选正确', async () => {
    const dayStart = new Date(2026, 0, 15).getTime()
    await insertTestRecord({ prompt: 'before', createdAt: dayStart - 1 })
    await insertTestRecord({ prompt: 'after', createdAt: dayStart })

    const result = await queryHistory({ startDate: dayStart })
    expect(result.records.length).toBe(1)
    expect(result.records[0].prompt).toBe('after')
  })

  it('无结果日期范围返回空', async () => {
    await insertTestRecord({ prompt: 'test', createdAt: 1000 })

    const result = await queryHistory({ startDate: 5000, endDate: 6000 })
    expect(result.records.length).toBe(0)
  })
})

describe('getHistoryById', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('按 ID 获取记录', async () => {
    const id = await insertTestRecord({ prompt: 'specific record' })
    const record = await getHistoryById(id)
    expect(record).toBeDefined()
    expect(record!.prompt).toBe('specific record')
  })

  it('不存在 ID 返回 undefined', async () => {
    const record = await getHistoryById(999999)
    expect(record).toBeUndefined()
  })
})

describe('getHistoryCount / getTotalBytes', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('getHistoryCount 返回正确数量', async () => {
    expect(await getHistoryCount()).toBe(0)
    await insertTestRecord()
    expect(await getHistoryCount()).toBe(1)
    await insertTestRecord()
    expect(await getHistoryCount()).toBe(2)
  })

  it('getTotalBytes 返回正确总容量', async () => {
    await insertTestRecord({ imageBytes: 1000 })
    await insertTestRecord({ imageBytes: 2000 })
    expect(await getTotalBytes()).toBe(3000)
  })
})
