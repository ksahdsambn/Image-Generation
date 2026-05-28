import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'
import { apiKeyStorageKeys, useApiKeyStore } from '@/stores/apiKeyStore'

describe('ApiKeyPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('accepts API Key input without rendering it as plain text elsewhere', async () => {
    const wrapper = mount(ApiKeyPanel, { props: { rememberKeyEnabled: true } })
    const input = wrapper.get('input[aria-label="Sub2API API Key"]')

    await input.setValue('sk-component')

    expect(useApiKeyStore().apiKey).toBe('sk-component')
    expect(wrapper.text()).not.toContain('sk-component')
  })

  it('toggles show and hide state', async () => {
    const wrapper = mount(ApiKeyPanel, { props: { rememberKeyEnabled: true } })
    const input = wrapper.get('input[aria-label="Sub2API API Key"]')

    expect(input.attributes('type')).toBe('password')
    await wrapper.get('button[aria-label="显示 API Key"]').trigger('click')

    expect(wrapper.get('input[aria-label="Sub2API API Key"]').attributes('type')).toBe('text')
  })

  it('clears API Key from all storage locations', async () => {
    const wrapper = mount(ApiKeyPanel, { props: { rememberKeyEnabled: true } })
    const store = useApiKeyStore()

    store.setApiKey('sk-clear')
    store.setRememberKey(true)
    await wrapper.get('button[aria-label="清除 API Key"]').trigger('click')

    expect(store.apiKey).toBe('')
    expect(sessionStorage.getItem(apiKeyStorageKeys.sessionApiKey)).toBeNull()
    expect(localStorage.getItem(apiKeyStorageKeys.localApiKey)).toBeNull()
  })

  it('shows a risk prompt when remember key is enabled', async () => {
    const wrapper = mount(ApiKeyPanel, { props: { rememberKeyEnabled: true } })

    await wrapper.get('input[aria-label="记住密钥"]').setValue(true)

    expect(wrapper.text()).toContain('localStorage')
  })
})
