import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiKeyStorageKeys, useApiKeyStore } from '@/stores/apiKeyStore'

describe('api key store', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('sets and reads an API Key from centralized state', () => {
    const store = useApiKeyStore()

    store.setApiKey('sk-session')

    expect(store.apiKey).toBe('sk-session')
    expect(store.hasApiKey).toBe(true)
  })

  it('persists API Key to sessionStorage by default', () => {
    const store = useApiKeyStore()

    store.setApiKey('sk-session')

    expect(sessionStorage.getItem(apiKeyStorageKeys.sessionApiKey)).toBe('sk-session')
    expect(localStorage.getItem(apiKeyStorageKeys.localApiKey)).toBeNull()
  })

  it('restores remembered API Key from localStorage', () => {
    localStorage.setItem(apiKeyStorageKeys.localRememberKey, 'true')
    localStorage.setItem(apiKeyStorageKeys.localApiKey, 'sk-remembered')
    const store = useApiKeyStore()

    store.hydrate()

    expect(store.rememberKey).toBe(true)
    expect(store.apiKey).toBe('sk-remembered')
  })

  it('clears localStorage when remember key is disabled', () => {
    const store = useApiKeyStore()

    store.setApiKey('sk-session')
    store.setRememberKey(true)
    store.setRememberKey(false)

    expect(localStorage.getItem(apiKeyStorageKeys.localApiKey)).toBeNull()
    expect(sessionStorage.getItem(apiKeyStorageKeys.sessionApiKey)).toBe('sk-session')
  })

  it('clears memory, sessionStorage and localStorage', () => {
    const store = useApiKeyStore()

    store.setApiKey('sk-secret')
    store.setRememberKey(true)
    store.clearApiKey()

    expect(store.apiKey).toBe('')
    expect(store.rememberKey).toBe(false)
    expect(sessionStorage.getItem(apiKeyStorageKeys.sessionApiKey)).toBeNull()
    expect(localStorage.getItem(apiKeyStorageKeys.localApiKey)).toBeNull()
    expect(localStorage.getItem(apiKeyStorageKeys.localRememberKey)).toBeNull()
  })
})
