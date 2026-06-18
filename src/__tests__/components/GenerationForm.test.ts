import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GenerationForm from '@/components/GenerationForm.vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_QUALITIES,
  IMAGE_BACKGROUNDS,
  OUTPUT_FORMATS,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_QUALITY,
  MAX_IMAGE_COUNT,
} from '@/types/generation'
import { createI18nForTest } from '@/__tests__/helpers/i18n'
import { i18n as globalI18n } from '@/i18n'

let pinia: ReturnType<typeof createPinia>

function mountForm() {
  return mount(GenerationForm, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

describe('GenerationForm (Step 18)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders prompt textarea', () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-testid="prompt-input"]').exists()).toBe(true)
  })

  it('shows prompt error when prompt is empty and has been touched', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.prompt = '  '
    await wrapper.vm.$nextTick()
    expect(store.promptError).toBeTruthy()
  })

  it('renders size select with correct options', () => {
    const wrapper = mountForm()
    const select = wrapper.find('[data-testid="size-select"]')
    expect(select.exists()).toBe(true)
    for (const option of IMAGE_SIZE_OPTIONS) {
      expect(select.html()).toContain(option.value)
      const label = globalI18n.global.t(`form.sizeOptions.${option.labelKey}`)
      expect(select.text()).toContain(label.trim())
    }
  })

  it('size select defaults to correct value', () => {
    const wrapper = mountForm()
    const select = wrapper.find('[data-testid="size-select"]')
    expect((select.element as HTMLSelectElement).value).toBe(DEFAULT_IMAGE_SIZE)
  })

  it('renders count display', () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-testid="count-display"]').exists()).toBe(true)
  })

  it('count defaults to 1', () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-testid="count-display"]').text()).toBe('1')
  })

  it('count increment works', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    const t = globalI18n.global.t
    const btns = wrapper.findAll(`button[aria-label="${t('form.countIncrement')}"]`)
    expect(btns.length).toBe(1)
    await btns[0].trigger('click')
    expect(store.n).toBe(2)
  })

  it('count decrement works', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.setCount(3)
    await wrapper.vm.$nextTick()
    const t = globalI18n.global.t
    const btns = wrapper.findAll(`button[aria-label="${t('form.countDecrement')}"]`)
    await btns[0].trigger('click')
    expect(store.n).toBe(2)
  })

  it('count cannot exceed max', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.setCount(MAX_IMAGE_COUNT)
    await wrapper.vm.$nextTick()
    const t = globalI18n.global.t
    const btns = wrapper.findAll(`button[aria-label="${t('form.countIncrement')}"]`)
    expect((btns[0].element as HTMLButtonElement).disabled).toBe(true)
  })

  it('count cannot go below min', () => {
    const wrapper = mountForm()
    const t = globalI18n.global.t
    const btns = wrapper.findAll(`button[aria-label="${t('form.countDecrement')}"]`)
    expect((btns[0].element as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders quality select with correct options', () => {
    const wrapper = mountForm()
    const select = wrapper.find('[data-testid="quality-select"]')
    expect(select.exists()).toBe(true)
    for (const q of IMAGE_QUALITIES) {
      expect(select.html()).toContain(q)
    }
    expect(select.text()).toContain('自动')
    expect(select.text()).toContain('低清')
    expect(select.text()).toContain('中等')
    expect(select.text()).toContain('高清')
  })

  it('renders background select with correct options', () => {
    const wrapper = mountForm()
    const select = wrapper.find('[data-testid="background-select"]')
    expect(select.exists()).toBe(true)
    for (const b of IMAGE_BACKGROUNDS) {
      expect(select.html()).toContain(b)
    }
  })

  it('renders output format select with correct options', () => {
    const wrapper = mountForm()
    const select = wrapper.find('[data-testid="format-select"]')
    expect(select.exists()).toBe(true)
    for (const f of OUTPUT_FORMATS) {
      expect(select.html()).toContain(f.toUpperCase())
    }
  })

  it('compression input hidden when format is png', () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.setOutputFormat('png')
    expect(wrapper.find('[data-testid="compression-input"]').exists()).toBe(false)
  })

  it('compression input visible when format is webp', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.setOutputFormat('webp')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="compression-input"]').exists()).toBe(true)
  })

  it('compression input visible when format is jpeg', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.setOutputFormat('jpeg')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="compression-input"]').exists()).toBe(true)
  })

  it('reset params button works', async () => {
    const wrapper = mountForm()
    const store = useGenerationParamsStore()
    store.prompt = 'test prompt'
    store.setSize('1536x1024')
    store.setCount(5)
    store.setQuality('high')
    await wrapper.vm.$nextTick()
    const resetBtn = wrapper.find('[data-testid="reset-params-btn"]')
    await resetBtn.trigger('click')
    expect(store.prompt).toBe('')
    expect(store.size).toBe(DEFAULT_IMAGE_SIZE)
    expect(store.n).toBe(1)
    expect(store.quality).toBe(DEFAULT_QUALITY)
  })

  it('no model selector visible', () => {
    const wrapper = mountForm()
    expect(wrapper.html()).not.toContain('gpt-image-2')
    expect(wrapper.html().toLowerCase()).not.toContain('模型')
  })
})
