import { describe, it, expect } from 'vitest'
import {
  classifyHttpError,
  classifyNetworkError,
  classifyStorageError,
  hasApiKeyLeak,
  sanitizeText,
  AppErrorCode,
} from '../types/errors'

describe('classifyHttpError', () => {
  it('classifies 401 as AUTH_FAILED', () => {
    const err = classifyHttpError(401)
    expect(err.code).toBe(AppErrorCode.AUTH_FAILED)
    expect(err.userMessage).toContain('API Key')
  })

  it('classifies 403 with image keyword as PERMISSION_DENIED', () => {
    const err = classifyHttpError(403, 'Image generation permission denied')
    expect(err.code).toBe(AppErrorCode.PERMISSION_DENIED)
    expect(err.userMessage).not.toContain('Image generation permission denied')
  })

  it('classifies 403 with quota keyword as INSUFFICIENT_QUOTA', () => {
    const err = classifyHttpError(403, 'Insufficient quota')
    expect(err.code).toBe(AppErrorCode.INSUFFICIENT_QUOTA)
    expect(err.userMessage).not.toContain('Insufficient quota')
  })

  it('classifies 403 with balance keyword as INSUFFICIENT_QUOTA', () => {
    const err = classifyHttpError(403, 'Balance exceeded')
    expect(err.code).toBe(AppErrorCode.INSUFFICIENT_QUOTA)
  })

  it('classifies 403 without matching keywords as PERMISSION_DENIED', () => {
    const err = classifyHttpError(403, 'Forbidden')
    expect(err.code).toBe(AppErrorCode.PERMISSION_DENIED)
  })

  it('classifies 429 as RATE_LIMITED', () => {
    const err = classifyHttpError(429)
    expect(err.code).toBe(AppErrorCode.RATE_LIMITED)
    expect(err.userMessage).toBeTruthy()
  })

  it('classifies 500, 502, and 503 as UPSTREAM_ERROR', () => {
    expect(classifyHttpError(500).code).toBe(AppErrorCode.UPSTREAM_ERROR)
    expect(classifyHttpError(502).code).toBe(AppErrorCode.UPSTREAM_ERROR)
    expect(classifyHttpError(503).code).toBe(AppErrorCode.UPSTREAM_ERROR)
  })

  it('classifies unknown status as UNKNOWN_ERROR', () => {
    const err = classifyHttpError(418)
    expect(err.code).toBe(AppErrorCode.UNKNOWN_ERROR)
  })

  it('sanitizes API Key from response body', () => {
    const apiKey = 'sk-abcdef1234567890abcdef1234567890abcdef'
    const err = classifyHttpError(401, `Invalid key ${apiKey}`)
    expect(err.debugHint).not.toContain(apiKey)
    expect(err.debugHint).toContain('***REDACTED***')
  })

  it('sanitizes explicitly supplied non-sk API Key from response body', () => {
    const apiKey = 'sub2api-key-with-hyphen-123'
    const err = classifyHttpError(200, `Upstream error echoed ${apiKey}`, [apiKey])
    expect(err.debugHint).not.toContain(apiKey)
    expect(err.debugHint).toContain('***REDACTED***')
  })

  it('does not contain API Key in userMessage for any status', () => {
    const statuses = [401, 403, 429, 500, 502, 503, 418]
    for (const status of statuses) {
      const err = classifyHttpError(status, 'sk-abcdef1234567890abcdef1234567890abcdef')
      expect(err.userMessage).not.toContain('sk-')
    }
  })
})

describe('classifyNetworkError', () => {
  it('classifies Failed to fetch as NETWORK_ERROR', () => {
    const err = classifyNetworkError(new TypeError('Failed to fetch'))
    expect(err.code).toBe(AppErrorCode.NETWORK_ERROR)
    expect(err.userMessage).toBeTruthy()
  })

  it('classifies CORS-like failures as CORS_BLOCKED', () => {
    expect(classifyNetworkError(new Error('CORS policy blocked')).code).toBe(AppErrorCode.CORS_BLOCKED)
    expect(classifyNetworkError(new Error('Cross-origin request blocked')).code).toBe(AppErrorCode.CORS_BLOCKED)
    expect(classifyNetworkError(new Error('Access-Control-Allow-Origin missing')).code).toBe(AppErrorCode.CORS_BLOCKED)
  })

  it('classifies timeout and abort as NETWORK_ERROR', () => {
    expect(classifyNetworkError(new Error('Request timed out')).code).toBe(AppErrorCode.NETWORK_ERROR)
    expect(classifyNetworkError(new DOMException('The operation was aborted', 'AbortError')).code).toBe(AppErrorCode.NETWORK_ERROR)
  })

  it('sanitizes API Key from network error message', () => {
    const apiKey = 'sk-abcdef1234567890abcdef1234567890abcdef'
    const err = classifyNetworkError(new Error(`Failed to fetch for ${apiKey}`))
    expect(err.debugHint).not.toContain(apiKey)
  })

  it('sanitizes explicitly supplied non-sk API Key from network error message', () => {
    const apiKey = 'sub2api-network-key-123'
    const err = classifyNetworkError(new Error(`Failed to fetch for ${apiKey}`), [apiKey])
    expect(err.debugHint).not.toContain(apiKey)
    expect(err.debugHint).toContain('***REDACTED***')
  })
})

describe('classifyStorageError', () => {
  it('classifies storage error with correct message', () => {
    const err = classifyStorageError(new Error('IndexedDB write failed'))
    expect(err.code).toBe(AppErrorCode.STORAGE_ERROR)
    expect(err.userMessage).toBeTruthy()
  })
})

describe('hasApiKeyLeak', () => {
  it('detects leaked API Key', () => {
    expect(hasApiKeyLeak('error with sk-abcdef1234567890abcdef1234567890abcdef')).toBe(true)
  })

  it('returns false for normal text', () => {
    expect(hasApiKeyLeak('normal error message')).toBe(false)
  })

  it('returns false for short key-like string', () => {
    expect(hasApiKeyLeak('sk-short')).toBe(false)
  })
})

describe('sanitizeText', () => {
  it('replaces API Key pattern', () => {
    const result = sanitizeText('key: sk-abcdef1234567890abcdef1234567890abcdef end')
    expect(result).toBe('key: ***REDACTED*** end')
  })

  it('leaves normal text unchanged', () => {
    expect(sanitizeText('normal text')).toBe('normal text')
  })

  it('redacts bearer tokens and key-like fields', () => {
    expect(sanitizeText('Authorization: Bearer sub2api-token-123')).not.toContain('sub2api-token-123')
    expect(sanitizeText('api_key=sub2api-token-123')).not.toContain('sub2api-token-123')
  })

  it('redacts explicitly supplied secrets before returning text', () => {
    const apiKey = 'custom-sub2api-key-123'
    expect(sanitizeText(`error with ${apiKey}`, [apiKey])).toBe('error with ***REDACTED***')
  })
})
