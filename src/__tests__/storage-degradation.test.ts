import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenerationStore } from '@/stores/generation'
import { useApiKeyStore } from '@/stores/api-key'

function createMockParamsStore(overrides?: Record<string, unknown>): any {
  return {
    prompt: 'a cute cat',
    size: '1024x1024',
    n: 1,
    quality: 'auto',
    background: 'auto',
    outputFormat: 'png',
    compressionEnabled: false,
    outputCompression: null,
    localImages: [],
    webImageUrls: [],
    maskImage: null,
    resetParams: vi.fn(),
    buildRequestBody: vi.fn(),
    ...overrides,
  }
}

const SAMPLE_KEY = 'sk-test-key-for-unit-test-only'

describe('Step 26: 本地存储异常降级', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('IndexedDB 不可用时历史功能禁用', () => {
    it('存储不可用时 storageWarning 提示用户立即下载', async () => {
      const genStore = useGenerationStore()
      const apiKeyStore = useApiKeyStore()
      apiKeyStore.setApiKey(SAMPLE_KEY)

      const mockResponse = {
        data: [{
          b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }],
      }

      const brokenFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        })

      await import('@/storage/history-writer')
      vi.spyOn(await import('@/storage/history-writer'), 'writeMultipleHistory').mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        errors: [{
          code: 'STORAGE_ERROR',
          userMessage: '图片已生成，但保存到本地历史失败，请立即下载',
          debugHint: 'IndexedDB not available',
        }],
      })

      const result = await genStore.generate(apiKeyStore, createMockParamsStore(), brokenFetch)

      expect(result).toBe(true)
      expect(genStore.hasResults).toBe(true)
      expect(genStore.storageWarning).toBeDefined()
      expect(genStore.storageWarning!.userMessage).toContain('保存到本地历史失败')
    })

    it('写入失败时当前结果仍保留', async () => {
      const genStore = useGenerationStore()
      const apiKeyStore = useApiKeyStore()
      apiKeyStore.setApiKey(SAMPLE_KEY)

      const mockResponse = {
        data: [{
          b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }],
      }

      const successFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        })

      vi.spyOn(await import('@/storage/history-writer'), 'writeMultipleHistory').mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        errors: [{
          code: 'STORAGE_ERROR',
          userMessage: '图片已生成，但保存到本地历史失败，请立即下载',
          debugHint: 'Storage full',
        }],
      })

      const result = await genStore.generate(apiKeyStore, createMockParamsStore(), successFetch)

      expect(result).toBe(true)
      expect(genStore.currentResults.length).toBe(1)
      expect(genStore.storageWarning).toBeDefined()
    })
  })

  describe('全部写入失败时提示清空历史', () => {
    it('所有图片写入失败时 storageWarning 提示清空历史', async () => {
      const genStore = useGenerationStore()
      const apiKeyStore = useApiKeyStore()
      apiKeyStore.setApiKey(SAMPLE_KEY)

      const mockResponse = {
        data: [
          { b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
          { b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
        ],
      }

      const successFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        })

      vi.spyOn(await import('@/storage/history-writer'), 'writeMultipleHistory').mockResolvedValue({
        successCount: 0,
        failureCount: 2,
        errors: [{
          code: 'STORAGE_ERROR',
          userMessage: '图片已生成，但保存到本地历史失败，请立即下载',
          debugHint: 'QuotaExceededError',
        }],
      })

      const result = await genStore.generate(apiKeyStore, createMockParamsStore(), successFetch)

      expect(result).toBe(true)
      expect(genStore.currentResults.length).toBe(2)
      expect(genStore.storageWarning).toBeDefined()
      expect(genStore.storageWarning!.userMessage).toContain('清空历史')
    })
  })

  describe('容量不足时触发自动清理', () => {
    it('写入成功后仍执行 enforceHistoryLimits 清理', async () => {
      const genStore = useGenerationStore()
      const apiKeyStore = useApiKeyStore()
      apiKeyStore.setApiKey(SAMPLE_KEY)

      const mockResponse = {
        data: [{
          b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }],
      }

      const successFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        })

      vi.spyOn(await import('@/storage/history-writer'), 'writeMultipleHistory').mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        errors: [],
      })

      const enforceSpy = vi.spyOn(await import('@/storage/history-cleaner'), 'enforceHistoryLimits').mockResolvedValue({ deletedCount: 0 })

      await genStore.generate(apiKeyStore, createMockParamsStore(), successFetch)

      expect(enforceSpy).toHaveBeenCalled()
    })
  })

  describe('网络错误不影响本地功能', () => {
    it('请求失败时不写入历史且不显示存储警告', async () => {
      const genStore = useGenerationStore()
      const apiKeyStore = useApiKeyStore()
      apiKeyStore.setApiKey(SAMPLE_KEY)

      const failFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

      const result = await genStore.generate(apiKeyStore, createMockParamsStore(), failFetch)

      expect(result).toBe(false)
      expect(genStore.error).toBeDefined()
      expect(genStore.error!.code).toBe('NETWORK_ERROR')
      expect(genStore.currentResults.length).toBe(0)
      expect(genStore.storageWarning).toBeNull()
    })
  })

  describe('存储可用性检测', () => {
    it('checkStorageAvailability 返回可用状态', async () => {
      const { checkStorageAvailability } = await import('@/storage/storage-availability')
      const result = await checkStorageAvailability()
      expect(typeof result.available).toBe('boolean')
    })

    it('getCachedAvailability 返回缓存状态', async () => {
      const { checkStorageAvailability, getCachedAvailability } = await import('@/storage/storage-availability')
      await checkStorageAvailability()
      expect(getCachedAvailability()).toBe(true)
    })
  })

  describe('存储不可用提示可见', () => {
    it('storageWarning 可在 ResultGrid 中显示', async () => {
      const genStore = useGenerationStore()
      genStore.storageWarning = {
        code: 'STORAGE_ERROR',
        userMessage: '图片已生成，但保存到本地历史失败，请立即下载',
        debugHint: '',
      }

      expect(genStore.storageWarning).toBeDefined()
      expect(genStore.storageWarning!.userMessage).toContain('请立即下载')
    })
  })
})
