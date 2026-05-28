import { describe, expect, it } from 'vitest'
import { loadAppConfig } from '@/config/appConfig'

describe('loadAppConfig', () => {
  it('reports a configuration error when Sub2API base URL is missing', () => {
    const result = loadAppConfig({})

    expect(result.ok).toBe(false)
    expect(result.config.sub2ApiBaseUrl).toBe('')
    expect(result.errors[0]).toContain('VITE_SUB2API_BASE_URL')
  })

  it('rejects invalid Sub2API base URLs', () => {
    const result = loadAppConfig({ VITE_SUB2API_BASE_URL: 'ftp://example.com' })

    expect(result.ok).toBe(false)
    expect(result.errors[0]).toContain('http 或 https')
  })

  it('normalizes a trailing slash from Sub2API base URL', () => {
    const result = loadAppConfig({ VITE_SUB2API_BASE_URL: 'https://sub2api.example.com///' })

    expect(result.ok).toBe(true)
    expect(result.config.sub2ApiBaseUrl).toBe('https://sub2api.example.com')
  })

  it('uses defaults for missing history limits', () => {
    const result = loadAppConfig({ VITE_SUB2API_BASE_URL: 'https://sub2api.example.com' })

    expect(result.config.historyMaxItems).toBe(50)
    expect(result.config.historyMaxBytes).toBe(500 * 1024 * 1024)
  })

  it('falls back to defaults for invalid history limits', () => {
    const result = loadAppConfig({
      VITE_SUB2API_BASE_URL: 'https://sub2api.example.com',
      VITE_HISTORY_MAX_ITEMS: '-1',
      VITE_HISTORY_MAX_BYTES: 'abc',
    })

    expect(result.config.historyMaxItems).toBe(50)
    expect(result.config.historyMaxBytes).toBe(500 * 1024 * 1024)
  })

  it('reads all supported configuration values', () => {
    const result = loadAppConfig({
      VITE_SUB2API_BASE_URL: 'https://sub2api.example.com',
      VITE_APP_TITLE: 'Custom Studio',
      VITE_HISTORY_MAX_ITEMS: '25',
      VITE_HISTORY_MAX_BYTES: '1024',
      VITE_REMEMBER_KEY_ENABLED: 'false',
    })

    expect(result.ok).toBe(true)
    expect(result.config).toMatchObject({
      appTitle: 'Custom Studio',
      historyMaxItems: 25,
      historyMaxBytes: 1024,
      rememberKeyEnabled: false,
    })
  })
})
