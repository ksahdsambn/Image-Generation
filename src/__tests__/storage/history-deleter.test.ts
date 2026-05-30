import { describe, it, expect, beforeEach } from 'vitest'
import { getDatabase } from '@/storage/database'
import { deleteHistoryRecord, clearAllHistory } from '@/storage/history-deleter'

function createTestBlob(size = 512): Blob {
  const data = new Uint8Array(size)
  for (let i = 0; i < size; i++) data[i] = i % 256
  return new Blob([data], { type: 'image/png' })
}

async function insertTestRecord(prompt = 'test'): Promise<number> {
  const db = getDatabase()
  const id = await db.history.add({
    imageBlob: createTestBlob(),
    thumbnailBlob: createTestBlob(64),
    prompt,
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
  })
  return id!
}

describe('删除单条历史', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('删除单条后无法再次读取', async () => {
    const id = await insertTestRecord('to delete')
    const deleted = await deleteHistoryRecord(id)
    expect(deleted).toBe(true)

    const db = getDatabase()
    const record = await db.history.get(id)
    expect(record).toBeUndefined()
  })

  it('删除不存在的记录返回 false', async () => {
    const deleted = await deleteHistoryRecord(999999)
    expect(deleted).toBe(false)
  })

  it('删除一条不影响其他记录', async () => {
    const id1 = await insertTestRecord('keep')
    const id2 = await insertTestRecord('delete')

    await deleteHistoryRecord(id2)

    const db = getDatabase()
    const remaining = await db.history.get(id1)
    expect(remaining).toBeDefined()
    expect(remaining!.prompt).toBe('keep')
    expect(await db.history.count()).toBe(1)
  })
})

describe('清空全部历史', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.history.clear()
  })

  it('清空后历史数量为零', async () => {
    await insertTestRecord('a')
    await insertTestRecord('b')
    await insertTestRecord('c')

    await clearAllHistory()

    const db = getDatabase()
    expect(await db.history.count()).toBe(0)
  })

  it('清空历史不会清除 sessionStorage API Key', async () => {
    sessionStorage.setItem('gpt_image_2_api_key', 'test-key-123')

    await insertTestRecord()
    await clearAllHistory()

    expect(sessionStorage.getItem('gpt_image_2_api_key')).toBe('test-key-123')
    sessionStorage.removeItem('gpt_image_2_api_key')
  })

  it('清空历史不会清除 localStorage API Key', async () => {
    localStorage.setItem('gpt_image_2_api_key_remember', 'test-key-456')

    await insertTestRecord()
    await clearAllHistory()

    expect(localStorage.getItem('gpt_image_2_api_key_remember')).toBe('test-key-456')
    localStorage.removeItem('gpt_image_2_api_key_remember')
  })

  it('空库清空不报错', async () => {
    await clearAllHistory()
    const db = getDatabase()
    expect(await db.history.count()).toBe(0)
  })
})
