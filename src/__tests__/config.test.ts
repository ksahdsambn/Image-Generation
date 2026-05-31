import { describe, it, expect } from 'vitest'
import { loadConfig } from '../utils/config'

describe('loadConfig', () => {
  const fullEnv = {
    VITE_SUB2API_BASE_URL: 'https://api.example.com',
    VITE_APP_TITLE: '测试站',
    VITE_HISTORY_MAX_ITEMS: '100',
    VITE_HISTORY_MAX_BYTES: '5368709120',
    VITE_REMEMBER_KEY_ENABLED: 'false',
  }

  it('reads all config from env', () => {
    const config = loadConfig(fullEnv)
    expect(config.sub2apiBaseUrl).toBe('https://api.example.com')
    expect(config.appTitle).toBe('测试站')
    expect(config.historyMaxItems).toBe(100)
    expect(config.historyMaxBytes).toBe(5368709120)
    expect(config.rememberKeyEnabled).toBe(false)
    expect(config.configError).toBeNull()
  })

  it('sets configError when base URL is missing', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: undefined })
    expect(config.sub2apiBaseUrl).toBe('')
    expect(config.configError).toContain('VITE_SUB2API_BASE_URL')
  })

  it('sets configError when base URL is empty string', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: '' })
    expect(config.configError).toContain('VITE_SUB2API_BASE_URL')
  })

  it('sets configError when base URL is whitespace', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: '   ' })
    expect(config.configError).toContain('VITE_SUB2API_BASE_URL')
  })

  it('removes trailing slash from base URL', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com/' })
    expect(config.sub2apiBaseUrl).toBe('https://api.example.com')
    expect(config.configError).toBeNull()
  })

  it('removes multiple trailing slashes from base URL', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com///' })
    expect(config.sub2apiBaseUrl).toBe('https://api.example.com')
  })

  it('uses default app title when missing', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com' })
    expect(config.appTitle).toBe('GPT Image 2 生图站')
  })

  it('uses default app title when empty', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_APP_TITLE: '   ',
    })
    expect(config.appTitle).toBe('GPT Image 2 生图站')
  })

  it('uses default history max items when missing', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com' })
    expect(config.historyMaxItems).toBe(50)
  })

  it('uses default history max items for invalid value', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_HISTORY_MAX_ITEMS: 'abc',
    })
    expect(config.historyMaxItems).toBe(50)
  })

  it('uses default history max items for negative value', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_HISTORY_MAX_ITEMS: '-10',
    })
    expect(config.historyMaxItems).toBe(50)
  })

  it('uses default history max items for zero', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_HISTORY_MAX_ITEMS: '0',
    })
    expect(config.historyMaxItems).toBe(50)
  })

  it('uses default history max items for float', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_HISTORY_MAX_ITEMS: '3.5',
    })
    expect(config.historyMaxItems).toBe(50)
  })

  it('uses default history max bytes when missing', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com' })
    expect(config.historyMaxBytes).toBe(5368709120)
  })

  it('uses default history max bytes for invalid value', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_HISTORY_MAX_BYTES: 'not-a-number',
    })
    expect(config.historyMaxBytes).toBe(5368709120)
  })

  it('uses default remember key enabled when missing', () => {
    const config = loadConfig({ VITE_SUB2API_BASE_URL: 'https://api.example.com' })
    expect(config.rememberKeyEnabled).toBe(true)
  })

  it('parses remember key enabled true', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_REMEMBER_KEY_ENABLED: 'true',
    })
    expect(config.rememberKeyEnabled).toBe(true)
  })

  it('parses remember key enabled false', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_REMEMBER_KEY_ENABLED: 'false',
    })
    expect(config.rememberKeyEnabled).toBe(false)
  })

  it('defaults remember key enabled to true for non-true string', () => {
    const config = loadConfig({
      VITE_SUB2API_BASE_URL: 'https://api.example.com',
      VITE_REMEMBER_KEY_ENABLED: 'yes',
    })
    expect(config.rememberKeyEnabled).toBe(false)
  })
})
