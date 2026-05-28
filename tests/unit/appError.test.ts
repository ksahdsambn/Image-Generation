import { describe, expect, it } from 'vitest'
import {
  classifyFetchException,
  classifyHttpError,
  createStorageError,
  getSafeErrorMessage,
} from '@/errors/appError'

describe('app error classification', () => {
  it.each([
    [401, 'auth', 'API Key 无效或已失效'],
    [403, 'image_permission', '当前 API Key 所属分组未启用图片生成权限'],
    [402, 'quota', '余额或额度不足'],
    [429, 'rate_limit', '请求过于频繁，请稍后重试'],
    [500, 'upstream', 'Sub2API 或上游图片服务暂时不可用'],
  ])('maps HTTP %s to %s', (status, code, message) => {
    const error = classifyHttpError({ status })

    expect(error.code).toBe(code)
    expect(error.message).toBe(message)
  })

  it('maps quota hints in error body to quota error', () => {
    const error = classifyHttpError({ status: 403, body: { error: 'insufficient_quota' } })

    expect(error.code).toBe('quota')
  })

  it('maps CORS and preflight browser failures to CORS guidance', () => {
    const error = classifyFetchException(new TypeError('CORS preflight failed'))

    expect(error.code).toBe('cors')
    expect(error.message).toContain('跨域访问')
  })

  it('maps ordinary browser network failures to a network prompt', () => {
    const error = classifyFetchException(new Error('ECONNREFUSED'))

    expect(error.code).toBe('network')
    expect(error.message).toContain('无法连接')
  })

  it('uses the required IndexedDB write failure prompt', () => {
    const error = createStorageError()

    expect(error.code).toBe('storage')
    expect(error.message).toContain('保存到本地历史失败')
  })

  it('does not include API keys from raw error bodies in safe prompts', () => {
    const secret = 'sk-test-secret'
    const error = classifyHttpError({
      status: 401,
      body: { message: `Authorization: Bearer ${secret}` },
    })

    expect(getSafeErrorMessage(error)).not.toContain(secret)
    expect(getSafeErrorMessage(error)).not.toContain('Bearer')
  })
})
