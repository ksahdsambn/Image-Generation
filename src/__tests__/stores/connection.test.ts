import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConnectionStore } from '@/stores/connection'

describe('Connection Store (Step 23)', () => {
  let connectionStore: ReturnType<typeof useConnectionStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    connectionStore = useConnectionStore()
  })

  it('initializes with idle status', () => {
    expect(connectionStore.status).toBe('idle')
    expect(connectionStore.error).toBeNull()
  })

  it('sets status to connected on successful test', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    const result = await connectionStore.runTest('sk-test-key-1234567890', mockFetch)

    expect(result).toBe(true)
    expect(connectionStore.status).toBe('connected')
    expect(connectionStore.error).toBeNull()
  })

  it('sets status to error on failed test', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('Unauthorized'),
    })

    const result = await connectionStore.runTest('sk-test-key-1234567890', mockFetch)

    expect(result).toBe(false)
    expect(connectionStore.status).toBe('error')
    expect(connectionStore.error).toBeTruthy()
    expect(connectionStore.error!.code).toBe('AUTH_FAILED')
  })

  it('sets status to testing during request', async () => {
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise(resolve => { resolvePromise = resolve })
    const mockFetch = vi.fn().mockReturnValue(pendingPromise)

    const testPromise = connectionStore.runTest('sk-test-key-1234567890', mockFetch)
    expect(connectionStore.status).toBe('testing')

    resolvePromise!({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    await testPromise
    expect(connectionStore.status).toBe('connected')
  })

  it('resets status to idle', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    await connectionStore.runTest('sk-test-key-1234567890', mockFetch)
    expect(connectionStore.status).toBe('connected')

    connectionStore.reset()
    expect(connectionStore.status).toBe('idle')
    expect(connectionStore.error).toBeNull()
  })

  it('clears error on new test', async () => {
    const failFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('Unauthorized'),
    })

    await connectionStore.runTest('sk-test-key-1234567890', failFetch)
    expect(connectionStore.error).toBeTruthy()

    const successFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
      text: () => Promise.resolve(''),
    })

    await connectionStore.runTest('sk-test-key-1234567890', successFetch)
    expect(connectionStore.error).toBeNull()
    expect(connectionStore.status).toBe('connected')
  })
})
