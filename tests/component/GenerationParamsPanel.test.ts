import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GenerationParamsPanel from '@/components/GenerationParamsPanel.vue'
import { useGenerationParamsStore } from '@/stores/generationParamsStore'

describe('GenerationParamsPanel', () => {
  const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}-${blob.size}`)
  const revokeObjectURL = vi.fn()
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    })
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  afterEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: originalCreateObjectURL },
      revokeObjectURL: { configurable: true, value: originalRevokeObjectURL },
    })
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

  it('keeps the Generate button disabled without API Key permission and during loading', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      props: { canGenerate: false },
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.setProps({ canGenerate: true, isGenerating: true })
    expect(wrapper.get('button[type="submit"]').text()).toContain('Generating')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.setProps({ isGenerating: false })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
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

  it('uploads reference images with previews and removes them', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })
    const file = new File(['image'], 'reference.png', { type: 'image/png' })
    const input = wrapper.get('input[aria-label="Reference images"]')

    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')

    expect(useGenerationParamsStore().referenceImages).toHaveLength(1)
    expect(wrapper.get('img[alt="Reference reference.png"]').attributes('src')).toBe('blob:image/png-5')
    await wrapper.get('button[aria-label="Remove reference.png"]').trigger('click')
    expect(useGenerationParamsStore().referenceImages).toHaveLength(0)
  })

  it('rejects non-image uploads and keeps them out of state', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const input = wrapper.get('input[aria-label="Reference images"]')

    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')

    expect(useGenerationParamsStore().referenceImages).toHaveLength(0)
    expect(wrapper.text()).toContain('Only image files under 10MB')
  })

  it('adds image URLs and validates invalid URLs before submission', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')
    await wrapper.get('input[aria-label="Image URL"]').setValue('ftp://example.com/a.png')
    await wrapper.get('button[type="button"]').trigger('click')

    expect(useGenerationParamsStore().imageUrls).toEqual(['ftp://example.com/a.png'])
    expect(wrapper.text()).toContain('Image URLs must start with http or https')
  })

  it('accepts local mask previews and mask URLs in params', async () => {
    const wrapper = mount(GenerationParamsPanel, {
      global: {
        plugins: [createPinia()],
      },
    })
    const mask = new File(['mask'], 'mask.png', { type: 'image/png' })
    const input = wrapper.get('input[aria-label="Mask image"]')

    Object.defineProperty(input.element, 'files', { configurable: true, value: [mask] })
    await input.trigger('change')
    expect(useGenerationParamsStore().maskImage?.name).toBe('mask.png')
    expect(wrapper.get('img[alt="Mask mask.png"]').attributes('src')).toBe('blob:image/png-4')

    useGenerationParamsStore().setMaskImage(null)
    await wrapper.get('input[aria-label="Mask URL"]').setValue('https://example.com/mask.png')
    expect(useGenerationParamsStore().maskImageUrl).toBe('https://example.com/mask.png')
  })
})
