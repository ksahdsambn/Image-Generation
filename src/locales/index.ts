import zhCN from './zh-CN'
import en from './en'
import zhTW from './zh-TW'
import ja from './ja'
import ko from './ko'

/**
 * 支持的语言清单。code 即 BCP 47 语言标签（也用于 <html lang>）。
 * label 用各自语言的母语名称展示，方便用户识别。
 */
export const SUPPORTED_LOCALES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
] as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

/** 兜底语言（找不到翻译或检测失败时使用） */
export const FALLBACK_LOCALE: LocaleCode = 'zh-CN'

export const messages = {
  'zh-CN': zhCN,
  'en': en,
  'zh-TW': zhTW,
  'ja': ja,
  'ko': ko,
} as const

export const SUPPORTED_LOCALE_CODES: readonly LocaleCode[] = SUPPORTED_LOCALES.map((l) => l.code)

export function isSupportedLocale(code: string): code is LocaleCode {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(code)
}
