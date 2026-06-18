import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Workbench from '@/pages/Workbench.vue'
import { useApiKeyStore } from '@/stores/api-key'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { useGenerationStore } from '@/stores/generation'
import { createI18nForTest } from '@/__tests__/helpers/i18n'

let pinia: ReturnType<typeof createPinia>

function mountWorkbench() {
  return mount(Workbench, {
    global: {
      plugins: [pinia, createI18nForTest()],
      stubs: {
        teleport: true,
      },
    },
  })
}

describe('Workbench Layout (Step 16)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders API Key area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="api-key-area"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="api-key-input"]').exists()).toBe(true)
  })

  it('places API Key area above local history in the right rail', () => {
    const wrapper = mountWorkbench()
    const rightRail = wrapper.find('[data-testid="right-rail"]')
    expect(rightRail.exists()).toBe(true)
    expect(rightRail.find('[data-testid="api-key-area"]').exists()).toBe(true)
    expect(rightRail.find('[data-testid="history-panel"]').exists()).toBe(true)
    expect(rightRail.html().indexOf('data-testid="api-key-area"')).toBeLessThan(
      rightRail.html().indexOf('data-testid="history-panel"'),
    )
  })

  it('renders generation form area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="generation-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="prompt-input"]').exists()).toBe(true)
  })

  it('renders result grid area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="result-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('renders history panel area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="history-panel"]').exists()).toBe(true)
  })

  it('renders generate button', () => {
    const wrapper = mountWorkbench()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect(btn.exists()).toBe(true)
  })

  it('disables generate button when API Key is missing', async () => {
    const wrapper = mountWorkbench()
    const paramsStore = useGenerationParamsStore()
    paramsStore.prompt = 'test prompt'
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables generate button when prompt is empty', async () => {
    const wrapper = mountWorkbench()
    const apiKeyStore = useApiKeyStore()
    apiKeyStore.setApiKey('sk-test-key')
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables generate button when API Key and prompt are valid', async () => {
    const wrapper = mountWorkbench()
    const apiKeyStore = useApiKeyStore()
    const paramsStore = useGenerationParamsStore()
    apiKeyStore.setApiKey('sk-test-key')
    paramsStore.prompt = 'a beautiful landscape'
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows loading state on generate button during generation', async () => {
    const wrapper = mountWorkbench()
    const apiKeyStore = useApiKeyStore()
    const paramsStore = useGenerationParamsStore()
    const generationStore = useGenerationStore()
    apiKeyStore.setApiKey('sk-test-key')
    paramsStore.prompt = 'test'
    generationStore.setGenerating(true)
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect(btn.text()).toContain('生成中')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('generate button has accessible label', () => {
    const wrapper = mountWorkbench()
    const btn = wrapper.find('[data-testid="generate-btn"]')
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('renders reference images area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="reference-images"]').exists()).toBe(true)
  })

  it('renders mask image area', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('[data-testid="mask-image-input"]').exists()).toBe(true)
  })
})
