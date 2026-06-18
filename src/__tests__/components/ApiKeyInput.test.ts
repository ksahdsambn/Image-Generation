import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ApiKeyInput from '@/components/ApiKeyInput.vue'
import { useApiKeyStore } from '@/stores/api-key'
import { useConnectionStore } from '@/stores/connection'
import { createI18nForTest } from '@/__tests__/helpers/i18n'

let pinia: ReturnType<typeof createPinia>

function mountApiKeyInput() {
  return mount(ApiKeyInput, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

describe('ApiKeyInput (Step 17)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders input field', () => {
    const wrapper = mountApiKeyInput()
    expect(wrapper.find('[data-testid="api-key-input"]').exists()).toBe(true)
  })

  it('input accepts text', async () => {
    const wrapper = mountApiKeyInput()
    const input = wrapper.find('[data-testid="api-key-input"]')
    await input.setValue('sk-test-key-123')
    const store = useApiKeyStore()
    expect(store.apiKey).toBe('sk-test-key-123')
  })

  it('input is password type by default', () => {
    const wrapper = mountApiKeyInput()
    const input = wrapper.find('[data-testid="api-key-input"]')
    expect(input.attributes('type')).toBe('password')
  })

  it('toggles visibility on button click', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-test')
    await wrapper.vm.$nextTick()
    const toggleBtn = wrapper.find('[data-testid="toggle-visible-btn"]')
    await toggleBtn.trigger('click')
    expect(store.visible).toBe(true)
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-testid="api-key-input"]')
    expect(input.attributes('type')).toBe('text')
  })

  it('clears API key on clear button click', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key')
    await wrapper.vm.$nextTick()
    const clearBtn = wrapper.find('[data-testid="clear-key-btn"]')
    await clearBtn.trigger('click')
    expect(store.apiKey).toBe('')
  })

  it('shows clear button only when key exists', async () => {
    const wrapper = mountApiKeyInput()
    expect(wrapper.find('[data-testid="clear-key-btn"]').exists()).toBe(false)
    const store = useApiKeyStore()
    store.setApiKey('sk-test')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="clear-key-btn"]').exists()).toBe(true)
  })

  it('shows remember key checkbox', () => {
    const wrapper = mountApiKeyInput()
    expect(wrapper.find('[data-testid="remember-key-checkbox"]').exists()).toBe(true)
  })

  it('shows risk hint when remember is enabled', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setRememberKey(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="remember-risk-hint"]').exists()).toBe(true)
  })

  it('hides risk hint when remember is disabled', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setRememberKey(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="remember-risk-hint"]').exists()).toBe(false)
  })

  it('toggle visible button has accessible label', () => {
    const wrapper = mountApiKeyInput()
    const btn = wrapper.find('[data-testid="toggle-visible-btn"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('clear button has accessible label', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-test')
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="clear-key-btn"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('does not display full key as visible text', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-very-long-secret-key-12345')
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).not.toContain('sk-very-long-secret-key-12345')
    const input = wrapper.find('[data-testid="api-key-input"]')
    expect(input.attributes('type')).toBe('password')
  })
})

describe('ApiKeyInput - Connection Test (Step 23)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('shows test connection button when key exists', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="test-connection-btn"]').exists()).toBe(true)
  })

  it('hides test connection button when no key', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.clearApiKey()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="test-connection-btn"]').exists()).toBe(false)
  })

  it('test connection button has accessible label', async () => {
    const wrapper = mountApiKeyInput()
    const store = useApiKeyStore()
    store.setApiKey('sk-test-key')
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="test-connection-btn"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('shows connection ok message on successful test', async () => {
    const wrapper = mountApiKeyInput()
    const apiKeyStore = useApiKeyStore()
    const connectionStore = useConnectionStore()
    apiKeyStore.setApiKey('sk-test-key-1234567890')
    connectionStore.status = 'connected'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="connection-ok"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="connection-ok"]').text()).toContain('连接正常')
  })

  it('shows error message on failed test', async () => {
    const wrapper = mountApiKeyInput()
    const apiKeyStore = useApiKeyStore()
    const connectionStore = useConnectionStore()
    apiKeyStore.setApiKey('sk-test-key-1234567890')
    connectionStore.status = 'error'
    connectionStore.error = { code: 'AUTH_FAILED', userMessage: 'API Key 无效', debugHint: '' }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="connection-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="connection-error"]').text()).toContain('API Key 无效')
  })

  it('resets connection status when API Key changes', async () => {
    const wrapper = mountApiKeyInput()
    const apiKeyStore = useApiKeyStore()
    const connectionStore = useConnectionStore()
    apiKeyStore.setApiKey('sk-test-key-1234567890')
    connectionStore.status = 'connected'
    await wrapper.vm.$nextTick()

    const input = wrapper.find('[data-testid="api-key-input"]')
    await input.setValue('sk-new-key')
    expect(connectionStore.status).toBe('idle')
  })
})
