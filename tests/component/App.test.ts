import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

describe('App shell', () => {
  it('renders the workspace regions', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.text()).toContain('Generation parameters')
    expect(wrapper.text()).toContain('Current results')
    expect(wrapper.text()).toContain('Local history')
  })
})
