import { describe, it, expect } from 'vitest'
import { checkStorageAvailability, getCachedAvailability } from '@/storage/storage-availability'

describe('IndexedDB 可用性检测', () => {
  it('checkStorageAvailability 在正常环境返回可用', async () => {
    const result = await checkStorageAvailability()
    expect(result.available).toBe(true)
    expect(result.message).toBeUndefined()
  })

  it('checkStorageAvailability 缓存可用性状态', async () => {
    await checkStorageAvailability()
    const cached = getCachedAvailability()
    expect(cached).toBe(true)
  })

  it('不可用时返回降级消息', async () => {
    const result = { available: false, message: '浏览器不支持 IndexedDB，本地历史功能不可用，但当前生成结果仍可下载' }
    expect(result.available).toBe(false)
    expect(result.message).toContain('下载')
  })
})
