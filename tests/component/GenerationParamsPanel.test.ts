import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import GenerationParamsPanel from '@/components/GenerationParamsPanel.vue'
import { useGenerationParamsStore } from '@/stores/generationParamsStore'

describe('GenerationParamsPanel', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('blocks submit when Prompt is empty', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Prompt is required')
  })

  it('emits normalized params after Prompt is provided', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('  A studio portrait  ')
    await wrapper.get('form').trigger('submit')

    const emitted = wrapper.emitted('submit')?.[0]?.[0]
    expect(emitted).toMatchObject({
      model: 'gpt-image-2',
      response_format: 'b64_json',
      prompt: 'A studio portrait',
    })
  })

  it('updates output format and disables compression for png', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('select[aria-label="Output format"]').setValue('png')

    expect(useGenerationParamsStore().outputCompression).toBeNull()
    expect(wrapper.get('input[aria-label="Output compression"]').attributes('disabled')).toBeDefined()
  })

  it('resets form params to defaults', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A changed prompt')
    await wrapper.get('input[aria-label="Image count"]').setValue('4')
    await wrapper.get('button[aria-label="Reset parameters"]').trigger('click')

    const store = useGenerationParamsStore()
    expect(store.prompt).toBe('')
    expect(store.count).toBe(1)
  })
})
