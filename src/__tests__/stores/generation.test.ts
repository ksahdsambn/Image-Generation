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

function createMockResponse(response: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  }
}

function createMockFetchSequence(responses: Array<{ response: any; ok?: boolean; status?: number }>) {
  let index = 0
  return vi.fn().mockImplementation(() => {
    const next = responses[index++]
    return Promise.resolve(createMockResponse(next.response, next.ok ?? true, next.status ?? 200))
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

function getJsonRequestBody(mockFetch: ReturnType<typeof vi.fn>, callIndex = 0) {
  const options = mockFetch.mock.calls[callIndex][1] as RequestInit
  return JSON.parse(options.body as string)
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
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
    })

    it('returns false when mask is provided without any reference image', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      paramsStore.setMaskImage({ file: new File(['mask'], 'mask.png', { type: 'image/png' }), previewUrl: 'blob:mask' })

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns false when local reference image is paired with mask URL', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      paramsStore.addLocalImage({ file: new File(['image'], 'image.png', { type: 'image/png' }), previewUrl: 'blob:image' })
      paramsStore.setMaskImage({ url: 'https://example.com/mask.png' })

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns false when web reference image is paired with local mask file', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'test'
      paramsStore.addWebImageUrl('https://example.com/image.png')
      paramsStore.setMaskImage({ file: new File(['mask'], 'mask.png', { type: 'image/png' }), previewUrl: 'blob:mask' })

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(generationStore.error!.code).toBe('VALIDATION_ERROR')
      expect(mockFetch).not.toHaveBeenCalled()
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

    it('requests once for n=1 and omits n from the request body', async () => {
      const mockFetch = createMockFetch(MOCK_API_RESPONSE)
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'single image'
      paramsStore.setCount(1)

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(getJsonRequestBody(mockFetch)).not.toHaveProperty('n')
    })

    it('requests n=3 as three single-image calls without n in any body', async () => {
      const mockFetch = createMockFetchSequence([
        { response: MOCK_API_RESPONSE },
        { response: MOCK_API_RESPONSE },
        { response: MOCK_API_RESPONSE },
      ])
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'three images'
      paramsStore.setCount(3)

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(getJsonRequestBody(mockFetch, 0)).not.toHaveProperty('n')
      expect(getJsonRequestBody(mockFetch, 1)).not.toHaveProperty('n')
      expect(getJsonRequestBody(mockFetch, 2)).not.toHaveProperty('n')
      expect(generationStore.currentResults.length).toBe(3)
      expect(generationStore.completedCount).toBe(3)
      expect(generationStore.targetCount).toBe(3)

      const db = getDatabase()
      expect(await db.history.count()).toBe(3)
      const record = await db.history.toCollection().first()
      expect(record!.n).toBe(3)
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

    it('redacts current API Key from prompt and revised prompt before storing results or history', async () => {
      const apiKey = 'sk-live-secret-1234567890'
      const mockFetch = createMockFetch({
        created: 1234567890,
        data: [
          {
            b64_json: MOCK_API_RESPONSE.data[0].b64_json,
            revised_prompt: `revised prompt containing ${apiKey}`,
          },
        ],
      })
      apiKeyStore.setApiKey(apiKey)
      paramsStore.prompt = `prompt containing ${apiKey}`

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(generationStore.currentResults[0].revisedPrompt).toContain('***REDACTED***')
      expect(generationStore.currentResults[0].revisedPrompt).not.toContain(apiKey)

      const db = getDatabase()
      const record = await db.history.toCollection().first()
      expect(record!.prompt).toBe('prompt containing ***REDACTED***')
      expect(record!.revisedPrompt).toBe('revised prompt containing ***REDACTED***')
      expect(JSON.stringify(record)).not.toContain(apiKey)
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

    it('sends local reference edits as repeated single-image requests without n', async () => {
      const mockFetch = createMockFetchSequence([
        { response: MOCK_API_RESPONSE },
        { response: MOCK_API_RESPONSE },
      ])
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'edit twice'
      paramsStore.setCount(2)
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      paramsStore.addLocalImage({ file, previewUrl: 'blob:test' })

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(mockFetch).toHaveBeenCalledTimes(2)
      for (const call of mockFetch.mock.calls) {
        const options = call[1] as RequestInit
        expect((options.body as FormData).get('n')).toBeNull()
      }
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

    it('sends web URL edits as repeated single-image requests without n', async () => {
      const mockFetch = createMockFetchSequence([
        { response: MOCK_API_RESPONSE },
        { response: MOCK_API_RESPONSE },
      ])
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'edit this url twice'
      paramsStore.setCount(2)
      paramsStore.addWebImageUrl('https://example.com/image.png')

      await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(getJsonRequestBody(mockFetch, 0)).not.toHaveProperty('n')
      expect(getJsonRequestBody(mockFetch, 1)).not.toHaveProperty('n')
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

    it('keeps successful images and history when a later single-image call fails', async () => {
      const mockFetch = createMockFetchSequence([
        { response: MOCK_API_RESPONSE },
        { response: { error: 'Server error' }, ok: false, status: 500 },
      ])
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'partial failure'
      paramsStore.setCount(3)

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(generationStore.currentResults.length).toBe(1)
      expect(generationStore.completedCount).toBe(1)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.userMessage).toContain('已生成 1/3')

      const db = getDatabase()
      expect(await db.history.count()).toBe(1)
    })

    it('keeps first-call failure behavior and does not write history', async () => {
      const mockFetch = createMockFetchError(500, 'Server error')
      apiKeyStore.setApiKey('sk-test-key-1234567890')
      paramsStore.prompt = 'first failure'
      paramsStore.setCount(3)

      const result = await generationStore.generate(apiKeyStore, paramsStore, mockFetch)

      expect(result).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(generationStore.currentResults.length).toBe(0)
      expect(generationStore.error).toBeTruthy()
      expect(generationStore.error!.userMessage).not.toContain('已生成')

      const db = getDatabase()
      expect(await db.history.count()).toBe(0)
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
