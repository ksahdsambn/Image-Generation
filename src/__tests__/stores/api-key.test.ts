import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApiKeyStore } from '../../stores/api-key'
import * as configModule from '../../utils/config'

const defaultConfig = {
  sub2apiBaseUrl: 'https://api.example.com',
  appTitle: 'Test',
  historyMaxItems: 50,
  historyMaxBytes: 524288000,
  rememberKeyEnabled: true,
  configError: null,
}

function createStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k]
    }),
    get length() { return Object.keys(store).length },
    key: vi.fn((_index: number) => null),
    _store: store,
  }
}

let sessionMock: ReturnType<typeof createStorageMock>
let localMock: ReturnType<typeof createStorageMock>

beforeEach(() => {
  vi.restoreAllMocks()
  sessionMock = createStorageMock()
  localMock = createStorageMock()
  vi.stubGlobal('sessionStorage', sessionMock)
  vi.stubGlobal('localStorage', localMock)
  vi.spyOn(configModule, 'loadConfig').mockReturnValue(defaultConfig)
  setActivePinia(createPinia())
})

describe('useApiKeyStore', () => {
  it('initializes with empty key by default', () => {
    const store = useApiKeyStore()
    expect(store.apiKey).toBe('')
    expect(store.hasKey).toBe(false)
  })

  it('sets and retrieves API key', () => {
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key-12345678')
    expect(store.apiKey).toBe('sk-test-key-12345678')
    expect(store.hasKey).toBe(true)
  })

  it('saves to sessionStorage by default', () => {
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key-12345678')
    expect(sessionMock.setItem).toHaveBeenCalledWith('gpt_image_2_api_key', 'sk-test-key-12345678')
    expect(localMock.getItem('gpt_image_2_remember_key')).toBeNull()
  })

  it('does not save to localStorage without rememberKey', () => {
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key-12345678')
    expect(localMock.getItem('gpt_image_2_api_key_remember')).toBeNull()
  })

  it('saves to localStorage when rememberKey is enabled', () => {
    const store = useApiKeyStore()
    store.setRememberKey(true)
    store.setApiKey('sk-test-key-12345678')
    expect(localMock.setItem).toHaveBeenCalledWith('gpt_image_2_api_key_remember', 'sk-test-key-12345678')
    expect(localMock.setItem).toHaveBeenCalledWith('gpt_image_2_remember_key', 'true')
  })

  it('recovers key from sessionStorage on init', () => {
    sessionMock._store['gpt_image_2_api_key'] = 'sk-session-key'
    setActivePinia(createPinia())
    const store = useApiKeyStore()
    expect(store.apiKey).toBe('sk-session-key')
  })

  it('recovers key from localStorage when remember was enabled', () => {
    localMock._store['gpt_image_2_remember_key'] = 'true'
    localMock._store['gpt_image_2_api_key_remember'] = 'sk-remembered-key'
    setActivePinia(createPinia())
    const store = useApiKeyStore()
    expect(store.apiKey).toBe('sk-remembered-key')
    expect(store.rememberKey).toBe(true)
  })

  it('prefers localStorage when both exist', () => {
    sessionMock._store['gpt_image_2_api_key'] = 'sk-session-key'
    localMock._store['gpt_image_2_remember_key'] = 'true'
    localMock._store['gpt_image_2_api_key_remember'] = 'sk-local-key'
    setActivePinia(createPinia())
    const store = useApiKeyStore()
    expect(store.apiKey).toBe('sk-local-key')
  })

  it('clears all storage locations on clearApiKey', () => {
    const store = useApiKeyStore()
    store.setRememberKey(true)
    store.setApiKey('sk-test-key-12345678')
    store.clearApiKey()
    expect(store.apiKey).toBe('')
    expect(store.hasKey).toBe(false)
    expect(store.rememberKey).toBe(false)
    expect(sessionMock.removeItem).toHaveBeenCalledWith('gpt_image_2_api_key')
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_api_key_remember')
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_remember_key')
  })

  it('toggles visibility', () => {
    const store = useApiKeyStore()
    expect(store.visible).toBe(false)
    store.toggleVisible()
    expect(store.visible).toBe(true)
    store.toggleVisible()
    expect(store.visible).toBe(false)
  })

  it('masks the key correctly', () => {
    const store = useApiKeyStore()
    store.setApiKey('sk-abcdefghijklmnop1234567890')
    expect(store.getMaskedKey()).toBe('sk-a****7890')
  })

  it('returns empty mask for empty key', () => {
    const store = useApiKeyStore()
    expect(store.getMaskedKey()).toBe('')
  })

  it('returns **** for short key', () => {
    const store = useApiKeyStore()
    store.setApiKey('sk-abcd')
    expect(store.getMaskedKey()).toBe('****')
  })

  it('removes localStorage key when rememberKey is turned off', () => {
    const store = useApiKeyStore()
    store.setRememberKey(true)
    store.setApiKey('sk-test-key-12345678')
    store.setRememberKey(false)
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_api_key_remember')
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_remember_key')
  })

  it('does not recover stale localStorage key when remember is disabled by config', () => {
    vi.spyOn(configModule, 'loadConfig').mockReturnValue({ ...defaultConfig, rememberKeyEnabled: false })
    localMock._store['gpt_image_2_remember_key'] = 'true'
    localMock._store['gpt_image_2_api_key_remember'] = 'stale-sub2api-key'
    sessionMock._store['gpt_image_2_api_key'] = 'session-sub2api-key'
    setActivePinia(createPinia())

    const store = useApiKeyStore()

    expect(store.apiKey).toBe('session-sub2api-key')
    expect(store.rememberKey).toBe(false)
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_api_key_remember')
    expect(localMock.removeItem).toHaveBeenCalledWith('gpt_image_2_remember_key')
  })

  it('does not write localStorage when remember is disabled by config', () => {
    vi.spyOn(configModule, 'loadConfig').mockReturnValue({ ...defaultConfig, rememberKeyEnabled: false })
    setActivePinia(createPinia())
    const store = useApiKeyStore()

    store.setRememberKey(true)
    store.setApiKey('sub2api-key-that-should-stay-session-only')

    expect(store.rememberKey).toBe(false)
    expect(sessionMock.getItem('gpt_image_2_api_key')).toBe('sub2api-key-that-should-stay-session-only')
    expect(localMock.getItem('gpt_image_2_api_key_remember')).toBeNull()
    expect(localMock.getItem('gpt_image_2_remember_key')).toBeNull()
  })
})
