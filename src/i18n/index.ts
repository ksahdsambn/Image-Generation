import { createI18n } from 'vue-i18n'
import { messages, FALLBACK_LOCALE, isSupportedLocale, type LocaleCode } from '@/locales'

/** localStorage 中保存用户语言偏好的键名 */
export const LOCALE_STORAGE_KEY = 'gpt_image_2_locale'

/**
 * 检测初始语言，优先级：
 *  1. localStorage 中已保存的用户选择
 *  2. 浏览器 navigator.language（精确匹配 → 前缀匹配，如 en-US→en、zh-TW→zh-TW、zh→zh-CN）
 *  3. 兜底 FALLBACK_LOCALE（zh-CN）
 */
export function detectInitialLocale(
  storage: Storage | null = typeof localStorage !== 'undefined' ? localStorage : null,
  navigatorLang: string | undefined = typeof navigator !== 'undefined' ? navigator.language : undefined,
): LocaleCode {
  if (storage) {
    const saved = storage.getItem(LOCALE_STORAGE_KEY)
    if (saved && isSupportedLocale(saved)) return saved
  }

  if (navigatorLang) {
    const lower = navigatorLang.toLowerCase()
    // 精确匹配（忽略大小写）
    const exact = Object.keys(messages).find((code) => code.toLowerCase() === lower)
    if (exact && isSupportedLocale(exact)) return exact

    // 中文分支：zh-TW / zh-Hant 等需映射到繁体，其余 zh* 映射到简体
    if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans') || lower.startsWith('zh-sg')) {
      return 'zh-CN'
    }
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hant') || lower.startsWith('zh-hk') || lower.startsWith('zh-mo')) {
      return 'zh-TW'
    }

    // 前缀匹配，如 en-US → en、ja-JP → ja、ko-KR → ko
    const prefix = lower.split('-')[0]
    const byPrefix = Object.keys(messages).find((code) => code.toLowerCase().startsWith(prefix + '-') || code.toLowerCase() === prefix)
    if (byPrefix && isSupportedLocale(byPrefix)) return byPrefix
  }

  return FALLBACK_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
})

/**
 * 翻译助手：供非 Vue setup 上下文（stores / services / storage 等纯逻辑模块）使用。
 * 用 i18n.global.t，自动响应 locale 切换。
 */
export function translateError(
  code: string,
  named?: Record<string, unknown>,
): string {
  return i18n.global.t(`errors.${code}`, named ?? {})
}

export function translateValidation(key: string, named?: Record<string, unknown>): string {
  return i18n.global.t(`validation.${key}`, named ?? {})
}

/** 同步 <html lang> 与当前 locale */
export function syncHtmlLang(locale?: string): void {
  if (typeof document === 'undefined') return
  const lang = locale ?? (i18n.global.locale.value as string)
  document.documentElement.lang = lang
}

export default i18n
