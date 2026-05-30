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
    expect(err.userMessage).toContain('图片生成权限')
  })

  it('classifies 403 with quota keyword as INSUFFICIENT_QUOTA', () => {
    const err = classifyHttpError(403, 'Insufficient quota')
    expect(err.code).toBe(AppErrorCode.INSUFFICIENT_QUOTA)
    expect(err.userMessage).toContain('余额或额度')
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
    expect(err.userMessage).toContain('频繁')
  })

  it('classifies 500 as UPSTREAM_ERROR', () => {
    const err = classifyHttpError(500)
    expect(err.code).toBe(AppErrorCode.UPSTREAM_ERROR)
  })

  it('classifies 502 as UPSTREAM_ERROR', () => {
    const err = classifyHttpError(502)
    expect(err.code).toBe(AppErrorCode.UPSTREAM_ERROR)
  })

  it('classifies 503 as UPSTREAM_ERROR', () => {
    const err = classifyHttpError(503)
    expect(err.code).toBe(AppErrorCode.UPSTREAM_ERROR)
  })

  it('classifies 418 as UNKNOWN_ERROR', () => {
    const err = classifyHttpError(418)
    expect(err.code).toBe(AppErrorCode.UNKNOWN_ERROR)
  })

  it('sanitizes API Key from response body', () => {
    const err = classifyHttpError(401, 'Invalid key sk-abcdef1234567890abcdef1234567890abcdef')
    expect(err.debugHint).not.toContain('sk-abcdef1234567890abcdef1234567890abcdef')
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
    expect(err.userMessage).toContain('无法连接')
  })

  it('classifies CORS error as CORS_BLOCKED', () => {
    const err = classifyNetworkError(new Error('CORS policy blocked'))
    expect(err.code).toBe(AppErrorCode.CORS_BLOCKED)
    expect(err.userMessage).toContain('跨域')
  })

  it('classifies cross-origin error as CORS_BLOCKED', () => {
    const err = classifyNetworkError(new Error('Cross-origin request blocked'))
    expect(err.code).toBe(AppErrorCode.CORS_BLOCKED)
  })

  it('classifies access-control error as CORS_BLOCKED', () => {
    const err = classifyNetworkError(new Error('Access-Control-Allow-Origin missing'))
    expect(err.code).toBe(AppErrorCode.CORS_BLOCKED)
  })

  it('classifies timeout as NETWORK_ERROR', () => {
    const err = classifyNetworkError(new Error('Request timed out'))
    expect(err.code).toBe(AppErrorCode.NETWORK_ERROR)
  })

  it('classifies abort as NETWORK_ERROR', () => {
    const err = classifyNetworkError(new DOMException('The operation was aborted', 'AbortError'))
    expect(err.code).toBe(AppErrorCode.NETWORK_ERROR)
  })

  it('sanitizes API Key from network error message', () => {
    const err = classifyNetworkError(new Error('Failed to fetch for sk-abcdef1234567890abcdef1234567890abcdef'))
    expect(err.debugHint).not.toContain('sk-abcdef1234567890abcdef1234567890abcdef')
  })
})

describe('classifyStorageError', () => {
  it('classifies storage error with correct message', () => {
    const err = classifyStorageError(new Error('IndexedDB write failed'))
    expect(err.code).toBe(AppErrorCode.STORAGE_ERROR)
    expect(err.userMessage).toContain('保存到本地历史失败')
    expect(err.userMessage).toContain('请立即下载')
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
})
