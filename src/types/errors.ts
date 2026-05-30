export const AppErrorCode = {
  AUTH_FAILED: 'AUTH_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',
  RATE_LIMITED: 'RATE_LIMITED',
  CORS_BLOCKED: 'CORS_BLOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode]

export interface AppError {
  code: AppErrorCode
  userMessage: string
  debugHint: string
}

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.AUTH_FAILED]: 'API Key 无效或已失效，请检查后重新输入',
  [AppErrorCode.PERMISSION_DENIED]: '当前 API Key 所属分组未启用图片生成权限',
  [AppErrorCode.INSUFFICIENT_QUOTA]: '余额或额度不足',
  [AppErrorCode.RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [AppErrorCode.CORS_BLOCKED]: 'Sub2API 后端未允许当前生图站域名跨域访问',
  [AppErrorCode.NETWORK_ERROR]: '无法连接到 Sub2API 后端',
  [AppErrorCode.UPSTREAM_ERROR]: '上游服务暂时不可用，请稍后重试',
  [AppErrorCode.STORAGE_ERROR]: '图片已生成，但保存到本地历史失败，请立即下载',
  [AppErrorCode.CONFIG_ERROR]: '应用配置有误，请检查环境变量设置',
  [AppErrorCode.VALIDATION_ERROR]: '请求参数无效，请检查输入',
  [AppErrorCode.UNKNOWN_ERROR]: '发生未知错误，请稍后重试',
}

export function hasApiKeyLeak(text: string): boolean {
  return /sk-[a-zA-Z0-9]{20,}/.test(text)
}

export function sanitizeText(text: string): string {
  return text.replace(/sk-[a-zA-Z0-9]{20,}/g, '***REDACTED***')
}

export function classifyHttpError(status: number, body?: string): AppError {
  const safeBody = typeof body === 'string' ? sanitizeText(body) : ''

  switch (status) {
    case 401:
      return { code: AppErrorCode.AUTH_FAILED, userMessage: ERROR_MESSAGES[AppErrorCode.AUTH_FAILED], debugHint: safeBody || 'HTTP 401' }
    case 403: {
      const lower = safeBody.toLowerCase()
      if (lower.includes('image') || lower.includes('图片') || lower.includes('permission')) {
        return { code: AppErrorCode.PERMISSION_DENIED, userMessage: ERROR_MESSAGES[AppErrorCode.PERMISSION_DENIED], debugHint: safeBody }
      }
      if (lower.includes('quota') || lower.includes('balance') || lower.includes('余额') || lower.includes('额度') || lower.includes('insufficient')) {
        return { code: AppErrorCode.INSUFFICIENT_QUOTA, userMessage: ERROR_MESSAGES[AppErrorCode.INSUFFICIENT_QUOTA], debugHint: safeBody }
      }
      return { code: AppErrorCode.PERMISSION_DENIED, userMessage: ERROR_MESSAGES[AppErrorCode.PERMISSION_DENIED], debugHint: safeBody }
    }
    case 429:
      return { code: AppErrorCode.RATE_LIMITED, userMessage: ERROR_MESSAGES[AppErrorCode.RATE_LIMITED], debugHint: safeBody || 'HTTP 429' }
    default:
      if (status >= 500) {
        return { code: AppErrorCode.UPSTREAM_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.UPSTREAM_ERROR], debugHint: `HTTP ${status}: ${safeBody}` }
      }
      return { code: AppErrorCode.UNKNOWN_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.UNKNOWN_ERROR], debugHint: `HTTP ${status}: ${safeBody}` }
  }
}

export function classifyNetworkError(error: Error): AppError {
  const msg = error.message || ''
  const lower = msg.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    const isLikelyCors = lower.includes('cors') || lower.includes('cross-origin')
    if (isLikelyCors) {
      return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: sanitizeText(msg) }
    }
    return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: sanitizeText(msg) }
  }

  if (lower.includes('cors') || lower.includes('cross-origin') || lower.includes('access-control')) {
    return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: sanitizeText(msg) }
  }

  if (lower.includes('typeerror') && lower.includes('failed to fetch')) {
    return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: 'CORS or network failure' }
  }

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: sanitizeText(msg) }
  }

  return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: sanitizeText(msg) }
}

export function classifyStorageError(error: Error): AppError {
  return { code: AppErrorCode.STORAGE_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.STORAGE_ERROR], debugHint: sanitizeText(error.message || '') }
}

export function createConfigError(message: string): AppError {
  return { code: AppErrorCode.CONFIG_ERROR, userMessage: message, debugHint: '' }
}

export function createValidationError(message: string): AppError {
  return { code: AppErrorCode.VALIDATION_ERROR, userMessage: message, debugHint: '' }
}
