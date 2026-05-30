import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'
import { apiKeyStorageKeys, useApiKeyStore } from '@/stores/apiKeyStore'

describe('ApiKeyPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.unstubAllGlobals()
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

  it('tests connection through the read-only endpoint and shows loading state', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchFn)
    const wrapper = mount(ApiKeyPanel, {
      props: {
        rememberKeyEnabled: true,
        sub2ApiBaseUrl: 'https://sub2api.example.com',
        canTestConnection: true,
      },
    })

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    const button = wrapper.get('button[aria-label="测试 Sub2API 连接"]')
    await button.trigger('click')

    expect(wrapper.text()).toContain('测试中')
    await vi.waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith('https://sub2api.example.com/v1/models', {
        method: 'GET',
        headers: { Authorization: 'Bearer sk-component' },
      })
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('连接正常')
    })
  })

  it('shows auth and CORS failures during connection checks', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'bad key' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchFn)
    const wrapper = mount(ApiKeyPanel, {
      props: {
        rememberKeyEnabled: true,
        sub2ApiBaseUrl: 'https://sub2api.example.com',
        canTestConnection: true,
      },
    })

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('button[aria-label="测试 Sub2API 连接"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('API Key 无效或已失效')
    })

    await wrapper.get('button[aria-label="测试 Sub2API 连接"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Sub2API 后端未允许当前生图站域名跨域访问')
    })
  })

  it('resets connection status after API Key changes', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchFn)
    const wrapper = mount(ApiKeyPanel, {
      props: {
        rememberKeyEnabled: true,
        sub2ApiBaseUrl: 'https://sub2api.example.com',
        canTestConnection: true,
      },
    })

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('button[aria-label="测试 Sub2API 连接"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('连接正常')
    })

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-new')

    expect(wrapper.text()).toContain('API Key 已修改，请重新测试连接')
  })
})
