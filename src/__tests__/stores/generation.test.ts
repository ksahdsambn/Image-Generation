import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGenerationStore } from '@/stores/generation'
import { useApiKeyStore } from '@/stores/api-key'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { getDatabase } from '@/storage/database'
import { setThumbnailGenerator } from '@/storage/history-writer'

function createMockFetch(response: any, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

function createMockFetchError(status: number, body = '') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  })
}

function createMockFetchNetworkError(errorMsg: string) {
  return vi.fn().mockRejectedValue(new TypeError(errorMsg))
}

const MOCK_API_RESPONSE = {
  created: 1234567890,
  data: [
    { b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
  ],
}

const MOCK_MULTI_API_RESPONSE = {
  created: 1234567890,
  data: [
    { b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
    { b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
  ],
}

describe('Generation Store - generate (Step 22)', () => {
  let generationStore: ReturnType<typeof useGenerationStore>
  let apiKeyStore: ReturnType<typeof useApiKeyStore>
  let paramsStore: ReturnType<typeof useGenerationParamsStore>

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    generationStore = useGenerationStore()
    apiKeyStore = useApiKeyStore()
    paramsStore = useGenerationParamsStore()
    setThumbnailGenerator(async (blob: Blob) => blob)
    try {
      await getDatabase().history.clear()
    } catch { /* ignore */ }
  })

  describe('validation before request', () => {
    it('returns false and sets error when API Key is missing', async () => {
      paramsStore.prompt = 'test prompt'
      const result = await generationStore.generate(apiKeyStore, paramsStore)
      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
      expect(generationStore.isGenerating).toBe(false)
    })

    it('returns false and sets error when Prompt is empty', async () => {
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = ''
      const result = await generationStore.generate(apiKeyStore, paramsStore)
      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
    })

    it('returns false and sets error when Prompt is whitespace only', async () => {
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = '   '
      const result = await generationStore.generate(apiKeyStore, paramsStore)
      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
    })

    it('returns false and sets error when mixed reference sources', async () => {
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      paramsStore.addLocalImage({ file: new File([''], 'test.png', { type: 'image/png' }), previewUrl: 'blob:test' })
      paramsStore.addWebImageUrl('https://example.com/image.png')
      const result = await generationStore.generate(apiKeyStore, paramsStore)
      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.userMessage).toContain('不能同时使用')
    })
  })

  describe('request mode selection - text-to-image (generations)', () => {
    it('calls generations endpoint when no reference images', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'a beautiful landscape'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('/v1/images/generations')
    })

    it('sets results and lastGenerationTime on success', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(generationStore.currentResults.length).toBe(1)
      expect(generationStore.lastGenerationTime).toBeTruthy()
      expect(generationStore.error).toBeNull()
      expect(generationStore.isGenerating).toBe(false)
    })

    it('handles multi-image response', async () => {
      const mockFetch = createMockFetch(MOCK_MULTI_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(generationStore.currentResults.length).toBe(2)
    })

    it('writes to IndexedDB history on success', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test for history'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const count = await db.history.count()
      expect(count).toBe(1)

      const record = await db.history.toCollection().first()
      expect(record!.prompt).toBe('test for history')
      expect(record!.model).toBe('gpt-image-2')
      expect(record!.requestMode).toBe('generations')
    })

    it('writes multiple history records for multi-image response', async () => {
      const mockFetch = createMockFetch(MOCK_MULTI_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'multi test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const count = await db.history.count()
      expect(count).toBe(2)
    })

    it('does not include API Key in history record', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'security test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const record = await db.history.toCollection().first()
      const serialized = JSON.stringify(record)
      expect(serialized).not.toContain('sk-test-key-1234567890')
    })
  })

  describe('request mode selection - local images (edits-multipart)', () => {
    it('calls edits endpoint with multipart when local images exist', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'edit this'
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      paramsStore.addLocalImage({ file, previewUrl: 'blob:test' })

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('/v1/images/edits')
    })

    it('writes history with requestMode edits-multipart', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'edit this'
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      paramsStore.addLocalImage({ file, previewUrl: 'blob:test' })

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const record = await db.history.toCollection().first()
      expect(record!.requestMode).toBe('edits-multipart')
    })
  })

  describe('request mode selection - web URLs (edits-json)', () => {
    it('calls edits endpoint with JSON when web URLs exist', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'edit this url'
      paramsStore.addWebImageUrl('https://example.com/image.png')

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('/v1/images/edits')
      const callOptions = mockFetch.mock.calls[0][1] as RequestInit
      expect(callOptions.headers).toHaveProperty('Content-Type')
    })

    it('writes history with requestMode edits-json', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'url edit test'
      paramsStore.addWebImageUrl('https://example.com/image.png')

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const record = await db.history.toCollection().first()
      expect(record!.requestMode).toBe('edits-json')
    })
  })

  describe('error handling', () => {
    it('sets error on HTTP 401 response', async () => {
      const mockFetch = createMockFetchError(401, 'Unauthorized')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('AUTH_FAILED')
    })

    it('sets error on HTTP 403 response', async () => {
      const mockFetch = createMockFetchError(403, 'Permission denied')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('PERMISSION_DENIED')
    })

    it('sets error on HTTP 429 response', async () => {
      const mockFetch = createMockFetchError(429, 'Too many requests')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error!.code).toBe('RATE_LIMITED')
    })

    it('sets error on network failure', async () => {
      const mockFetch = createMockFetchNetworkError('Failed to fetch')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('NETWORK_ERROR')
    })

    it('sets error on CORS failure', async () => {
      const mockFetch = createMockFetchNetworkError('Cross-Origin Request Blocked')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error!.code).toBe('CORS_BLOCKED')
    })

    it('does not write history on failure', async () => {
      const mockFetch = createMockFetchError(401, 'Unauthorized')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      const db = getDatabase()
      const count = await db.history.count()
      expect(count).toBe(0)
    })

    it('preserves previous results on new failure so user can retry', async () => {
      const successFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      await generationStore.generate(apiKeyStore, paramsStore, successFetch)
      expect(generationStore.currentResults.length).toBe(1)

      const failFetch = createMockFetchError(500, 'Server error')
      await generationStore.generate(apiKeyStore, paramsStore, failFetch)
      expect(generationStore.currentResults.length).toBe(1)
      expect(generationStore.error).toBeTruthy()
    })

    it('resets isGenerating in finally block', async () => {
      const mockFetch = createMockFetchError(500, 'Server error')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)
      expect(generationStore.isGenerating).toBe(false)
    })
  })

  describe('empty response handling', () => {
    it('sets error when API response has empty data', async () => {
      const mockFetch = createMockFetch({ data: [] })
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('storage warning', () => {
    it('keeps results even when history write fails', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      await import('@/storage/history-writer')
      vi.spyOn(await import('@/storage/history-writer'), 'writeMultipleHistory').mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        errors: [{ code: 'STORAGE_ERROR', userMessage: 'IndexedDB 写入失败', debugHint: '' }],
      })

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(generationStore.currentResults.length).toBe(1)
      expect(generationStore.storageWarning).toBeTruthy()
    })
  })

  describe('state management during generation', () => {
    it('sets isGenerating to true during request', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise(resolve => { resolvePromise = resolve })
      const mockFetch = vi.fn().mockReturnValue(pendingPromise)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'

      const generatePromise = generationStore.generate(apiKeyStore, paramsStore, mockFetch)
      expect(generationStore.isGenerating).toBe(true)

      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_API_RESPONSE),
        text: () => Promise.resolve(''),
      })

      await generatePromise
      expect(generationStore.isGenerating).toBe(false)
    })

    it('clears previous error when starting new generation', async () => {
      const failFetch = createMockFetchError(401)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      await generationStore.generate(apiKeyStore, paramsStore, failFetch)
      expect(generationStore.error).toBeTruthy()

      const successFetch = createMockFetch(MOCK_API_RESPONSE)
      await generationStore.generate(apiKeyStore, paramsStore, successFetch)
      expect(generationStore.error).toBeNull()
    })
  })
})
