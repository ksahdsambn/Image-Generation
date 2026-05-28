import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

describe('configuration UI', () => {
  it('shows a visible configuration error when Base URL is not configured', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.text()).toContain('Configuration error')
    expect(wrapper.text()).toContain('VITE_SUB2API_BASE_URL')
  })

  it('does not render a page-level Base URL input', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    })
    const inputs = wrapper.findAll('input')

    expect(inputs.some((input) => /base url|backend url/i.test(input.attributes('aria-label') || ''))).toBe(false)
    expect(wrapper.text()).not.toContain('Base URL')
  })
})
