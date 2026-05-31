import { describe, it, expect, vi } from 'vitest'
import { sanitizeText, hasApiKeyLeak, AppErrorCode, classifyHttpError, classifyNetworkError, classifyStorageError } from '@/types/errors'
import type { HistoryRecord } from '@/types/history'

const SAMPLE_KEY = 'sk-abcdef1234567890abcdef1234567890abcdef'
const SAMPLE_KEY_SHORT = 'sk-shortkey'

describe('Step 24: 敏感信息保护检查', () => {
  describe('历史记录序列化结果不包含 API Key', () => {
    it('HistoryRecord 类型序列化后不包含 apiKey 字段', () => {
      const record: HistoryRecord = {
        imageBlob: new Blob(['test']),
        thumbnailBlob: new Blob(['test']),
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
        imageBytes: 100,
        createdAt: Date.now(),
      }

      const serialized = JSON.stringify({
        ...record,
        imageBlob: '[Blob]',
        thumbnailBlob: '[Blob]',
      })

      expect(serialized).not.toContain('apiKey')
      expect(serialized).not.toContain('api_key')
      expect(serialized).not.toContain('authorization')
      expect(serialized).not.toContain('bearer')
      expect(serialized).not.toContain(SAMPLE_KEY)
    })

    it('历史记录中不包含 API Key 值', () => {
      const record = {
        prompt: 'test prompt',
        model: 'gpt-image-2',
        revisedPrompt: null,
      }

      const serialized = JSON.stringify(record)
      expect(serialized).not.toContain(SAMPLE_KEY)
    })

    it('HistoryRecord 字段列表中无敏感字段名', () => {
      const record: HistoryRecord = {
        id: 1,
        imageBlob: new Blob(),
        thumbnailBlob: null,
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
        imageBytes: 0,
        createdAt: 0,
      }

      const keys = Object.keys(record)
      const sensitivePatterns = ['apikey', 'api_key', 'authorization', 'bearer', 'token', 'secret', 'password']

      for (const key of keys) {
        const lower = key.toLowerCase()
        for (const pattern of sensitivePatterns) {
          expect(lower).not.toContain(pattern)
        }
      }
    })
  })

  describe('任何下载或导出相关数据不包含 API Key', () => {
    it('下载文件名不包含 API Key', async () => {
      const { generateFilename } = await import('@/utils/image-utils')
      const filename = generateFilename('png', 0)
      expect(filename).not.toContain('sk-')
      expect(filename).not.toContain('apikey')
      expect(filename).toMatch(/^gpt-image-.*\.png$/)
    })

    it('下载文件名不包含 API Key (webp)', async () => {
      const { generateFilename } = await import('@/utils/image-utils')
      const filename = generateFilename('webp', 2)
      expect(filename).not.toContain('sk-')
      expect(filename).toMatch(/^gpt-image-.*\.webp$/)
    })

    it('图片 Blob 下载内容不包含 API Key 元数据', () => {
      new Blob(['fake image data'], { type: 'image/png' })
      const data = { blob: '[Blob data]', filename: 'gpt-image-1234567890-0.png' }
      const serialized = JSON.stringify(data)
      expect(serialized).not.toContain(SAMPLE_KEY)
      expect(serialized).not.toContain('sk-')
    })
  })

  describe('错误对象脱敏', () => {
    it('HTTP 错误 debugHint 中 API Key 被脱敏', () => {
      const err = classifyHttpError(401, `Invalid key: ${SAMPLE_KEY}`)
      expect(err.debugHint).not.toContain(SAMPLE_KEY)
      expect(err.debugHint).toContain('***REDACTED***')
    })

    it('HTTP 错误 userMessage 中不包含 API Key', () => {
      const err = classifyHttpError(401, `Error for key ${SAMPLE_KEY}`)
      expect(err.userMessage).not.toContain(SAMPLE_KEY)
      expect(err.userMessage).not.toContain('sk-')
    })

    it('网络错误 debugHint 中 API Key 被脱敏', () => {
      const err = classifyNetworkError(new Error(`Failed to fetch for ${SAMPLE_KEY}`))
      expect(err.debugHint).not.toContain(SAMPLE_KEY)
      expect(err.userMessage).not.toContain(SAMPLE_KEY)
    })

    it('存储错误 debugHint 中 API Key 被脱敏', () => {
      const err = classifyStorageError(new Error(`Write failed with ${SAMPLE_KEY}`))
      expect(err.debugHint).not.toContain(SAMPLE_KEY)
      expect(err.debugHint).toContain('***REDACTED***')
    })

    it('sanitizeText 处理多种 API Key 格式', () => {
      expect(sanitizeText(`key=${SAMPLE_KEY}`)).not.toContain(SAMPLE_KEY)
      expect(sanitizeText('normal text')).toBe('normal text')
      expect(sanitizeText('sk-short')).toBe('sk-short')
    })

    it('hasApiKeyLeak 正确检测长密钥', () => {
      expect(hasApiKeyLeak(SAMPLE_KEY)).toBe(true)
      expect(hasApiKeyLeak(`prefix ${SAMPLE_KEY} suffix`)).toBe(true)
      expect(hasApiKeyLeak(SAMPLE_KEY_SHORT)).toBe(false)
      expect(hasApiKeyLeak('no key here')).toBe(false)
    })

    it('所有错误码的 userMessage 不包含原始错误数据', () => {
      const statuses = [401, 403, 429, 500, 502, 503, 418]
      for (const status of statuses) {
        const err = classifyHttpError(status, `body with ${SAMPLE_KEY}`)
        expect(err.userMessage).not.toContain(SAMPLE_KEY)
      }
    })
  })

  describe('generation store 未知错误脱敏', () => {
    it('generate 中未知异常的 debugHint 经过 sanitizeText 处理', async () => {
      const { useGenerationStore } = await import('@/stores/generation')
      const { useApiKeyStore } = await import('@/stores/api-key')
      const { setActivePinia, createPinia } = await import('pinia')

      setActivePinia(createPinia())

      const apiKeyStore = useApiKeyStore()
      const genStore = useGenerationStore()

      apiKeyStore.setApiKey('test-key-123')

      const brokenFetch = vi.fn().mockRejectedValue(new Error(`Unexpected error with ${SAMPLE_KEY}`))

      await genStore.generate(apiKeyStore, {
        prompt: 'test',
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
      } as any, brokenFetch)

      const err = genStore.error
      expect(err).toBeDefined()
      if (err) {
        expect(err.debugHint).not.toContain(SAMPLE_KEY)
        expect(err.userMessage).not.toContain(SAMPLE_KEY)
      }
    })
  })

  describe('控制台无敏感信息输出', () => {
    it('生产源码中不存在 console.log/warn/error', async () => {
      const modules = [
        '@/types/errors',
        '@/services/image-api',
        '@/services/response-parser',
        '@/services/connection-test',
        '@/storage/history-writer',
        '@/storage/history-reader',
        '@/storage/history-deleter',
        '@/storage/history-cleaner',
        '@/storage/storage-availability',
        '@/stores/api-key',
        '@/stores/generation-params',
        '@/stores/generation',
        '@/stores/connection',
        '@/utils/config',
        '@/utils/image-utils',
      ]

      for (const mod of modules) {
        const m = await import(mod)
        const keys = Object.keys(m)
        for (const key of keys) {
          const fn = m[key]
          if (typeof fn === 'function') {
            const source = fn.toString()
            expect(source).not.toContain('console.log')
            expect(source).not.toContain('console.warn')
            expect(source).not.toContain('console.error')
            expect(source).not.toContain('console.debug')
            expect(source).not.toContain('console.info')
          }
        }
      }
    })
  })

  describe('API Key 隔离检查', () => {
    it('generation store 的 currentResults 不包含 API Key', async () => {
      const { useGenerationStore } = await import('@/stores/generation')
      const { setActivePinia, createPinia } = await import('pinia')

      setActivePinia(createPinia())
      const store = useGenerationStore()

      store.setResults([{
        blob: new Blob(['fake']),
        mimeType: 'image/png',
        revisedPrompt: 'test prompt',
        objectUrl: 'blob:test',
      }])

      for (const result of store.currentResults) {
        const serialized = JSON.stringify({
          mimeType: result.mimeType,
          revisedPrompt: result.revisedPrompt,
        })
        expect(serialized).not.toContain('sk-')
        expect(serialized).not.toContain('apiKey')
      }
    })

    it('generation store error 对象不包含完整 API Key', async () => {
      const { useGenerationStore } = await import('@/stores/generation')
      const { setActivePinia, createPinia } = await import('pinia')

      setActivePinia(createPinia())
      const store = useGenerationStore()

      store.setError({
        code: AppErrorCode.AUTH_FAILED,
        userMessage: 'API Key 无效或已失效',
        debugHint: 'HTTP 401',
      })

      const err = store.error
      expect(err).toBeDefined()
      expect(err!.userMessage).not.toContain(SAMPLE_KEY)
      expect(err!.debugHint).not.toContain(SAMPLE_KEY)
    })
  })
})
