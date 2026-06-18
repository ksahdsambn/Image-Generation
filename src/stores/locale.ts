import { defineStore } from 'pinia'
import { computed } from 'vue'
import { i18n, LOCALE_STORAGE_KEY, syncHtmlLang } from '@/i18n'
import { isSupportedLocale, SUPPORTED_LOCALES, type LocaleCode } from '@/locales'

/**
 * 语言切换状态。
 *
 * - currentLocale：双向绑定 i18n.global.locale，computed 读写均透传给 vue-i18n。
 * - setLocale：切换语言 → 同步 vue-i18n + localStorage + <html lang>。
 * 仿照 api-key.ts 的 localStorage 持久化模式。
 */
export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = computed<LocaleCode>({
    get: () => i18n.global.locale.value as LocaleCode,
    set: (value) => {
      applyLocale(value)
    },
  })

  /** 应用某个语言：更新 vue-i18n、写 localStorage、同步 <html lang> */
  function applyLocale(code: LocaleCode): void {
    i18n.global.locale.value = code
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code)
    } catch {
      // 隐私模式或配额满：忽略，运行时切换仍生效，只是无法持久化
    }
    syncHtmlLang(code)
  }

  /** 外部切换器调用入口；非法 code 静默忽略 */
  function setLocale(code: string): void {
    if (!isSupportedLocale(code)) return
    applyLocale(code)
  }

  return {
    /** 可选语言清单 */
    options: SUPPORTED_LOCALES,
    currentLocale,
    setLocale,
  }
})
