const DEFAULT_APP_TITLE = 'GPT Image 2 生图站'
const DEFAULT_HISTORY_MAX_ITEMS = 50
const DEFAULT_HISTORY_MAX_BYTES = 500 * 1024 * 1024

export type RawAppEnv = Record<string, string | boolean | undefined>

export type AppConfig = {
  sub2ApiBaseUrl: string
  appTitle: string
  historyMaxItems: number
  historyMaxBytes: number
  rememberKeyEnabled: boolean
}

export type AppConfigResult =
  | {
      ok: true
      config: AppConfig
      errors: []
    }
  | {
      ok: false
      config: Omit<AppConfig, 'sub2ApiBaseUrl'> & { sub2ApiBaseUrl: '' }
      errors: string[]
    }

export function loadAppConfig(env: RawAppEnv): AppConfigResult {
  const appTitle = normalizeOptionalString(env.VITE_APP_TITLE) || DEFAULT_APP_TITLE
  const historyMaxItems = parsePositiveInteger(env.VITE_HISTORY_MAX_ITEMS, DEFAULT_HISTORY_MAX_ITEMS)
  const historyMaxBytes = parsePositiveInteger(env.VITE_HISTORY_MAX_BYTES, DEFAULT_HISTORY_MAX_BYTES)
  const rememberKeyEnabled = parseBoolean(env.VITE_REMEMBER_KEY_ENABLED, true)
  const rawBaseUrl = normalizeOptionalString(env.VITE_SUB2API_BASE_URL)
  const normalizedBaseUrl = rawBaseUrl ? normalizeBaseUrl(rawBaseUrl) : ''
  const errors: string[] = []

  if (!normalizedBaseUrl) {
    errors.push('缺少 VITE_SUB2API_BASE_URL，请在构建环境中配置 Sub2API 后端地址。')
  } else if (!isHttpUrl(normalizedBaseUrl)) {
    errors.push('VITE_SUB2API_BASE_URL 必须是合法的 http 或 https 地址。')
  }

  const config = {
    sub2ApiBaseUrl: normalizedBaseUrl && isHttpUrl(normalizedBaseUrl) ? normalizedBaseUrl : '',
    appTitle,
    historyMaxItems,
    historyMaxBytes,
    rememberKeyEnabled,
  }

  if (errors.length > 0) {
    return {
      ok: false,
      config,
      errors,
    }
  }

  return {
    ok: true,
    config: {
      ...config,
      sub2ApiBaseUrl: normalizedBaseUrl,
    },
    errors: [],
  }
}

export function getRuntimeConfig(): AppConfigResult {
  return loadAppConfig(import.meta.env)
}

function normalizeOptionalString(value: string | boolean | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function parsePositiveInteger(value: string | boolean | undefined, fallback: number): number {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseBoolean(value: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}
