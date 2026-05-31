import { describe, it, expect, vi } from 'vitest'
import { testConnection } from '@/services/connection-test'

describe('Connection Test Service (Step 23)', () => {
  it('returns validation error when API Key is empty', async () => {
    const result = await testConnection('', vi.fn())
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.error!.code).toBe('VALIDATION_ERROR')
  })

  it('returns validation error when API Key is whitespace', async () => {
    const result = await testConnection('   ', vi.fn())
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('VALIDATION_ERROR')
  })

  it('sends GET request to /v1/models with correct auth header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    const result = await testConnection('sk-test-key-1234567890', mockFetch)

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/v1/models')
    const options = mockFetch.mock.calls[0][1] as RequestInit
    expect(options.method).toBe('GET')
    expect(options.headers).toHaveProperty('Authorization', 'Bearer sk-test-key-1234567890')
  })

  it('returns success on 200 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    const result = await testConnection('sk-test-key-1234567890', mockFetch)
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('returns AUTH_FAILED on 401 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('Unauthorized'),
    })

    const result = await testConnection('sk-test-key-1234567890', mockFetch)
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('AUTH_FAILED')
  })

  it('returns CORS_BLOCKED on CORS failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Cross-Origin Request Blocked'))

    const result = await testConnection('sk-test-key-1234567890', mockFetch)
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('CORS_BLOCKED')
  })

  it('returns NETWORK_ERROR on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await testConnection('sk-test-key-1234567890', mockFetch)
    expect(result.success).toBe(false)
    expect(result.error!.code).toBe('NETWORK_ERROR')
  })

  it('does not call image generation endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    await testConnection('sk-test-key-1234567890', mockFetch)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).not.toContain('/v1/images/generations')
    expect(calledUrl).not.toContain('/v1/images/edits')
  })
})
