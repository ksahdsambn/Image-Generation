export interface AppConfig {
  sub2apiBaseUrl: string
  appTitle: string
  historyMaxItems: number
  historyMaxBytes: number
  rememberKeyEnabled: boolean
  configError: string | null
}

const DEFAULT_APP_TITLE = 'GPT Image 2 生图站'
const DEFAULT_HISTORY_MAX_ITEMS = 50
const DEFAULT_HISTORY_MAX_BYTES = 5368709120
const DEFAULT_REMEMBER_KEY_ENABLED = true

function normalizeBaseUrl(url: string | undefined): string {
  if (!url || url.trim() === '') return ''
  return url.replace(/\/+$/, '')
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) return fallback
  return parsed
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true'
}

export function loadConfig(env?: Record<string, string | undefined>): AppConfig {
  const e = env ?? (import.meta.env as Record<string, string | undefined>)

  const rawBaseUrl = normalizeBaseUrl(e.VITE_SUB2API_BASE_URL)
  const configError: string | null = rawBaseUrl === ''
    ? '缺少 Sub2API 后端地址配置，请在环境变量中设置 VITE_SUB2API_BASE_URL'
    : null

  return {
    sub2apiBaseUrl: rawBaseUrl,
    appTitle: e.VITE_APP_TITLE?.trim() || DEFAULT_APP_TITLE,
    historyMaxItems: parsePositiveInt(e.VITE_HISTORY_MAX_ITEMS, DEFAULT_HISTORY_MAX_ITEMS),
    historyMaxBytes: parsePositiveInt(e.VITE_HISTORY_MAX_BYTES, DEFAULT_HISTORY_MAX_BYTES),
    rememberKeyEnabled: parseBoolean(e.VITE_REMEMBER_KEY_ENABLED, DEFAULT_REMEMBER_KEY_ENABLED),
    configError,
  }
}
