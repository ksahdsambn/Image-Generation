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

const MAX_DISPLAY_ERROR_LENGTH = 240

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
}

function truncateForDisplay(value: string): string {
  return value.length > MAX_DISPLAY_ERROR_LENGTH
    ? `${value.slice(0, MAX_DISPLAY_ERROR_LENGTH - 1)}…`
    : value
}

function normalizeDisplayMessage(value: string, explicitSecrets: string[] = []): string {
  return truncateForDisplay(collapseWhitespace(stripHtml(sanitizeText(value, explicitSecrets))))
}

function pickStringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function extractStructuredErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null

  if (Array.isArray(value)) {
    const messages = value
      .map(item => extractStructuredErrorMessage(item))
      .filter((item): item is string => Boolean(item))
    return messages.length > 0 ? messages.join('; ') : null
  }

  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const directMessage = pickStringField(record, [
    'message',
    'detail',
    'msg',
    'error_description',
    'reason',
    'description',
  ])
  if (directMessage) return directMessage

  const nestedMessage = extractStructuredErrorMessage(record.error)
    ?? extractStructuredErrorMessage(record.errors)
    ?? extractStructuredErrorMessage(record.data)
  if (nestedMessage) return nestedMessage

  const fallbackCode = pickStringField(record, ['code', 'type'])
  return fallbackCode
}

function getResponseErrorMessage(body?: string, explicitSecrets: string[] = []): string {
  if (typeof body !== 'string' || !body.trim()) return ''

  try {
    const parsed = JSON.parse(body) as unknown
    const extracted = extractStructuredErrorMessage(parsed)
    if (extracted) return normalizeDisplayMessage(extracted, explicitSecrets)
  } catch {
    // Plain-text and HTML error bodies are handled below.
  }

  return normalizeDisplayMessage(body, explicitSecrets)
}

export function hasApiKeyLeak(text: string): boolean {
  return /sk-[a-zA-Z0-9_-]{20,}/.test(text)
}

export function sanitizeText(text: string, explicitSecrets: string[] = []): string {
  let safe = text
  for (const secret of explicitSecrets) {
    if (secret.trim()) {
      safe = safe.replace(new RegExp(escapeRegExp(secret), 'g'), '***REDACTED***')
    }
  }
  safe = safe.replace(/sk-[a-zA-Z0-9_-]{20,}/g, '***REDACTED***')
  safe = safe.replace(/(Authorization\s*:\s*Bearer\s+)[^"'\s,}]+/gi, '$1***REDACTED***')
  safe = safe.replace(/((?:api[_-]?key|token|secret|password)\s*["'=:\s]+\s*["']?)[^"',\s}]+/gi, '$1***REDACTED***')
  return safe
}

export function classifyHttpError(status: number, body?: string, explicitSecrets: string[] = []): AppError {
  const safeBody = typeof body === 'string' ? sanitizeText(body, explicitSecrets) : ''
  const lower = typeof body === 'string' ? body.toLowerCase() : ''
  const responseMessage = getResponseErrorMessage(body, explicitSecrets)

  if (lower.includes('invalid_api_key') || lower.includes('invalid api key') || lower.includes('unauthorized')) {
    return { code: AppErrorCode.AUTH_FAILED, userMessage: ERROR_MESSAGES[AppErrorCode.AUTH_FAILED], debugHint: safeBody || `HTTP ${status}` }
  }
  if (lower.includes('rate_limit') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return { code: AppErrorCode.RATE_LIMITED, userMessage: ERROR_MESSAGES[AppErrorCode.RATE_LIMITED], debugHint: safeBody || `HTTP ${status}` }
  }
  if (lower.includes('quota') || lower.includes('balance') || lower.includes('insufficient') || lower.includes('余额') || lower.includes('额度')) {
    return { code: AppErrorCode.INSUFFICIENT_QUOTA, userMessage: ERROR_MESSAGES[AppErrorCode.INSUFFICIENT_QUOTA], debugHint: safeBody }
  }
  if (lower.includes('permission') || lower.includes('forbidden') || lower.includes('not allowed')) {
    return { code: AppErrorCode.PERMISSION_DENIED, userMessage: ERROR_MESSAGES[AppErrorCode.PERMISSION_DENIED], debugHint: safeBody }
  }
  if (lower.includes('cors') || lower.includes('cross-origin') || lower.includes('access-control')) {
    return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: safeBody }
  }

  switch (status) {
    case 400:
    case 422:
      return {
        code: AppErrorCode.VALIDATION_ERROR,
        userMessage: responseMessage
          ? `请求参数错误（HTTP ${status}）：${responseMessage}`
          : ERROR_MESSAGES[AppErrorCode.VALIDATION_ERROR],
        debugHint: safeBody || `HTTP ${status}`,
      }
    case 401:
      return { code: AppErrorCode.AUTH_FAILED, userMessage: ERROR_MESSAGES[AppErrorCode.AUTH_FAILED], debugHint: safeBody || 'HTTP 401' }
    case 403:
      return { code: AppErrorCode.PERMISSION_DENIED, userMessage: ERROR_MESSAGES[AppErrorCode.PERMISSION_DENIED], debugHint: safeBody || 'HTTP 403' }
    case 429:
      return { code: AppErrorCode.RATE_LIMITED, userMessage: ERROR_MESSAGES[AppErrorCode.RATE_LIMITED], debugHint: safeBody || 'HTTP 429' }
    default:
      if (status >= 500) {
        return {
          code: AppErrorCode.UPSTREAM_ERROR,
          userMessage: responseMessage
            ? `上游错误（HTTP ${status}）：${responseMessage}`
            : ERROR_MESSAGES[AppErrorCode.UPSTREAM_ERROR],
          debugHint: `HTTP ${status}: ${safeBody}`,
        }
      }
      return {
        code: AppErrorCode.UNKNOWN_ERROR,
        userMessage: responseMessage
          ? `请求失败（HTTP ${status}）：${responseMessage}`
          : ERROR_MESSAGES[AppErrorCode.UNKNOWN_ERROR],
        debugHint: `HTTP ${status}: ${safeBody}`,
      }
  }
}

export function classifyNetworkError(error: Error, explicitSecrets: string[] = []): AppError {
  const msg = error.message || ''
  const lower = msg.toLowerCase()
  const safeMsg = sanitizeText(msg, explicitSecrets)

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    const isLikelyCors = lower.includes('cors') || lower.includes('cross-origin')
    if (isLikelyCors) {
      return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: safeMsg }
    }
    return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: safeMsg }
  }

  if (lower.includes('cors') || lower.includes('cross-origin') || lower.includes('access-control')) {
    return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: safeMsg }
  }

  if (lower.includes('typeerror') && lower.includes('failed to fetch')) {
    return { code: AppErrorCode.CORS_BLOCKED, userMessage: ERROR_MESSAGES[AppErrorCode.CORS_BLOCKED], debugHint: 'CORS or network failure' }
  }

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: safeMsg }
  }

  return { code: AppErrorCode.NETWORK_ERROR, userMessage: ERROR_MESSAGES[AppErrorCode.NETWORK_ERROR], debugHint: safeMsg }
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

/** skill 规范文件加载失败时使用，复用 NETWORK_ERROR 的用户提示文案。 */
export function createNetworkError(err: Error, explicitSecrets: string[] = []): AppError {
  return classifyNetworkError(err, explicitSecrets)
}
