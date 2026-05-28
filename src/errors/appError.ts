export type AppErrorCode =
  | 'auth'
  | 'image_permission'
  | 'quota'
  | 'rate_limit'
  | 'cors'
  | 'network'
  | 'upstream'
  | 'storage'
  | 'validation'
  | 'unknown'

export type AppError = {
  code: AppErrorCode
  message: string
  retryable: boolean
}

export type ErrorResponseLike = {
  status: number
  body?: unknown
}

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  auth: 'API Key 无效或已失效',
  image_permission: '当前 API Key 所属分组未启用图片生成权限',
  quota: '余额或额度不足',
  rate_limit: '请求过于频繁，请稍后重试',
  cors: 'Sub2API 后端未允许当前生图站域名跨域访问',
  network: '无法连接到 Sub2API 后端',
  upstream: 'Sub2API 或上游图片服务暂时不可用',
  storage: '图片已生成，但保存到本地历史失败，请立即下载',
  validation: '请检查输入内容后重试',
  unknown: '请求失败，请稍后重试',
}

export function createAppError(code: AppErrorCode): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    retryable: ['rate_limit', 'cors', 'network', 'upstream', 'storage', 'unknown'].includes(code),
  }
}

export function classifyHttpError(response: ErrorResponseLike): AppError {
  const bodyText = safeBodyText(response.body)

  if (response.status === 401) {
    return createAppError('auth')
  }

  if (response.status === 403) {
    return bodyText.includes('quota') || bodyText.includes('余额') || bodyText.includes('额度')
      ? createAppError('quota')
      : createAppError('image_permission')
  }

  if (response.status === 402 || bodyText.includes('insufficient_quota')) {
    return createAppError('quota')
  }

  if (response.status === 429) {
    return createAppError('rate_limit')
  }

  if (response.status >= 500) {
    return createAppError('upstream')
  }

  return createAppError('unknown')
}

export function classifyFetchException(error: unknown): AppError {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (message.includes('cors') || message.includes('preflight') || message.includes('access-control')) {
    return createAppError('cors')
  }

  if (message.includes('failed to fetch')) {
    return createAppError('cors')
  }

  return createAppError('network')
}

export function createStorageError(): AppError {
  return createAppError('storage')
}

export function getSafeErrorMessage(error: AppError): string {
  return error.message
}

function safeBodyText(body: unknown): string {
  if (!body) {
    return ''
  }

  if (typeof body === 'string') {
    return body.toLowerCase()
  }

  try {
    return JSON.stringify(body).toLowerCase()
  } catch {
    return ''
  }
}
