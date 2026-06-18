import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LocaleSwitcher from '@/components/LocaleSwitcher.vue'
import { i18n } from '@/i18n'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createI18nForTest } from '@/__tests__/helpers/i18n'

let pinia: ReturnType<typeof createPinia> = createPinia()

function mountSwitcher() {
  return mount(LocaleSwitcher, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.lang = 'zh-CN'
    i18n.global.locale.value = 'zh-CN'
  })

  it('renders the switcher button', () => {
    const wrapper = mountSwitcher()
    expect(wrapper.find('[data-testid="locale-switcher-btn"]').exists()).toBe(true)
  })

  it('opens the menu on click and lists all supported locales', async () => {
    const wrapper = mountSwitcher()
    await wrapper.find('[data-testid="locale-switcher-btn"]').trigger('click')
    const menu = wrapper.find('[data-testid="locale-switcher-menu"]')
    expect(menu.exists()).toBe(true)
    // 每个支持的语言都对应一个 option 按钮
    for (const code of ['zh-CN', 'en', 'zh-TW', 'ja', 'ko']) {
      expect(wrapper.find(`[data-testid="locale-option-${code}"]`).exists()).toBe(true)
    }
  })

  it('switches language when an option is selected', async () => {
    const wrapper = mountSwitcher()
    await wrapper.find('[data-testid="locale-switcher-btn"]').trigger('click')
    await wrapper.find('[data-testid="locale-option-en"]').trigger('click')
    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    // 选择后菜单关闭
    expect(wrapper.find('[data-testid="locale-switcher-menu"]').exists()).toBe(false)
  })

  it('marks the active locale as selected', async () => {
    const wrapper = mountSwitcher()
    await wrapper.find('[data-testid="locale-switcher-btn"]').trigger('click')
    const active = wrapper.find('[data-testid="locale-option-zh-CN"]')
    expect(active.attributes('aria-selected')).toBe('true')
  })
})
