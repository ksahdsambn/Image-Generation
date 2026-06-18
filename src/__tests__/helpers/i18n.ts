/**
 * 测试用 i18n 插件工厂。
 *
 * 每个组件 mount 需要一个独立的 vue-i18n 实例（@vue/test-utils 每次 mount
 * 都创建新 app），统一在 beforeEach 中以 zh-CN 初始化，保证断言稳定。
 *
 * 用法：
 *   import { createI18nForTest } from '@/__tests__/helpers/i18n'
 *   const i18n = createI18nForTest()
 *   mount(Component, { global: { plugins: [pinia, i18n] } })
 */
import { createI18n } from 'vue-i18n'
import { messages } from '@/locales'

export function createI18nForTest(locale: 'zh-CN' | 'en' | 'zh-TW' | 'ja' | 'ko' = 'zh-CN') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages,
  })
}
