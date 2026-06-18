import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLocaleStore } from '@/stores/locale'
import { i18n, detectInitialLocale, LOCALE_STORAGE_KEY } from '@/i18n'
import { messages, FALLBACK_LOCALE, SUPPORTED_LOCALES } from '@/locales'

/** 收集嵌套对象的所有叶子 key 路径（用点号连接），用于跨语言比对。 */
function collectLeafKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : []
  }
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

describe('locales', () => {
  it('declares exactly 5 supported locales with zh-CN fallback', () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code)
    expect(codes).toEqual(['zh-CN', 'en', 'zh-TW', 'ja', 'ko'])
    expect(FALLBACK_LOCALE).toBe('zh-CN')
  })

  it('every supported locale has a messages entry', () => {
    for (const { code } of SUPPORTED_LOCALES) {
      expect(messages[code]).toBeDefined()
    }
  })

  it('every locale exposes the same key set as zh-CN (no missing translations)', () => {
    const baseKeys = new Set(collectLeafKeys(messages['zh-CN']))
    expect(baseKeys.size).toBeGreaterThan(0)
    for (const { code } of SUPPORTED_LOCALES) {
      if (code === 'zh-CN') continue
      const localeKeys = new Set(collectLeafKeys(messages[code]))
      const missing = [...baseKeys].filter((k) => !localeKeys.has(k))
      const extra = [...localeKeys].filter((k) => !baseKeys.has(k))
      expect(missing, `locale ${code} missing keys`).toEqual([])
      expect(extra, `locale ${code} has extra keys`).toEqual([])
    }
  })

  it('no leaf value is empty string (would render blank)', () => {
    function hasEmpty(obj: unknown): boolean {
      if (obj === null || typeof obj !== 'object') return false
      for (const v of Object.values(obj as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim() === '') return true
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && hasEmpty(v)) return true
      }
      return false
    }
    for (const { code } of SUPPORTED_LOCALES) {
      expect(hasEmpty(messages[code]), `locale ${code} has empty string value`).toBe(false)
    }
  })
})

describe('detectInitialLocale', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns saved locale when present in localStorage', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    expect(detectInitialLocale()).toBe('en')
  })

  it('falls back when localStorage value is unsupported and navigator does not match', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr-FR')
    expect(detectInitialLocale(null, 'fr-FR')).toBe(FALLBACK_LOCALE)
  })

  it('matches navigator.language exactly (case-insensitive)', () => {
    expect(detectInitialLocale(null, 'en-US')).toBe('en')
    expect(detectInitialLocale(null, 'ja-JP')).toBe('ja')
    expect(detectInitialLocale(null, 'ko-KR')).toBe('ko')
  })

  it('maps zh variants to the right Chinese variant', () => {
    expect(detectInitialLocale(null, 'zh')).toBe('zh-CN')
    expect(detectInitialLocale(null, 'zh-CN')).toBe('zh-CN')
    expect(detectInitialLocale(null, 'zh-Hans')).toBe('zh-CN')
    expect(detectInitialLocale(null, 'zh-TW')).toBe('zh-TW')
    expect(detectInitialLocale(null, 'zh-Hant')).toBe('zh-TW')
    expect(detectInitialLocale(null, 'zh-HK')).toBe('zh-TW')
  })

  it('returns fallback when nothing matches', () => {
    expect(detectInitialLocale(null, 'fr-FR')).toBe(FALLBACK_LOCALE)
    expect(detectInitialLocale(null, 'xx-XX')).toBe(FALLBACK_LOCALE)
  })
})

describe('locale store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.lang = 'zh-CN'
    i18n.global.locale.value = 'zh-CN'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('currentLocale reflects i18n global locale', () => {
    const store = useLocaleStore()
    i18n.global.locale.value = 'en'
    expect(store.currentLocale).toBe('en')
  })

  it('setLocale updates i18n, localStorage and <html lang>', () => {
    const store = useLocaleStore()
    store.setLocale('ja')
    expect(i18n.global.locale.value).toBe('ja')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
  })

  it('setLocale ignores unsupported codes', () => {
    const store = useLocaleStore()
    store.setLocale('ja')
    store.setLocale('french' as any)
    expect(i18n.global.locale.value).toBe('ja')
  })

  it('switching language changes translated output', () => {
    const store = useLocaleStore()
    expect(i18n.global.t('history.title')).toBe('本地历史')
    store.setLocale('en')
    expect(i18n.global.t('history.title')).toBe('Local history')
    store.setLocale('ja')
    expect(i18n.global.t('history.title')).toBe('ローカル履歴')
  })
})
