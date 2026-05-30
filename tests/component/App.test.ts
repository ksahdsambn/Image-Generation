import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { useApiKeyStore } from '@/stores/apiKeyStore'

describe('App shell', () => {
  it('renders the workspace regions', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.text()).toContain('Generation parameters')
    expect(wrapper.text()).toContain('Current results')
    expect(wrapper.text()).toContain('Local history')
  })

  it('keeps generation disabled when API Key is missing', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('does not render API Key outside the key input area', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    })

    useApiKeyStore().setApiKey('sk-app-secret')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('sk-app-secret')
  })
})
