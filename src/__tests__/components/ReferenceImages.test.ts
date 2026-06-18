import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReferenceImages from '@/components/ReferenceImages.vue'
import MaskImageInput from '@/components/MaskImageInput.vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { createI18nForTest } from '@/__tests__/helpers/i18n'

let pinia: ReturnType<typeof createPinia>

function mountReferenceImages() {
  return mount(ReferenceImages, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

function mountMaskImageInput() {
  return mount(MaskImageInput, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

function createImageFile(name = 'test.png', type = 'image/png', size = 1024) {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('ReferenceImages (Step 19)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders upload button', () => {
    const wrapper = mountReferenceImages()
    expect(wrapper.find('[data-testid="upload-btn"]').exists()).toBe(true)
  })

  it('renders URL input', () => {
    const wrapper = mountReferenceImages()
    expect(wrapper.find('[data-testid="url-input"]').exists()).toBe(true)
  })

  it('renders add URL button', () => {
    const wrapper = mountReferenceImages()
    expect(wrapper.find('[data-testid="add-url-btn"]').exists()).toBe(true)
  })

  it('adds local image via file input', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    const file = createImageFile()
    const input = wrapper.find('[data-testid="file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    expect(store.localImages.length).toBe(1)
  })

  it('shows preview after uploading image', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    store.addLocalImage({ file: createImageFile(), previewUrl: 'blob:preview1' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="local-image-previews"]').exists()).toBe(true)
  })

  it('removes local image on click', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    store.addLocalImage({ file: createImageFile(), previewUrl: 'blob:preview1' })
    await wrapper.vm.$nextTick()
    const removeBtn = wrapper.find('[data-testid="local-image-previews"] button')
    await removeBtn.trigger('click')
    expect(store.localImages.length).toBe(0)
  })

  it('rejects non-image file type', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    const file = createImageFile('test.txt', 'text/plain')
    const input = wrapper.find('[data-testid="file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    expect(store.localImages.length).toBe(0)
    expect(wrapper.find('[data-testid="validation-error"]').exists()).toBe(true)
  })

  it('adds web URL', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    const urlInput = wrapper.find('[data-testid="url-input"]')
    await urlInput.setValue('https://example.com/image.png')
    const addBtn = wrapper.find('[data-testid="add-url-btn"]')
    await addBtn.trigger('click')
    expect(store.webImageUrls.length).toBe(1)
    expect(store.webImageUrls[0].url).toBe('https://example.com/image.png')
  })

  it('rejects invalid URL', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    const urlInput = wrapper.find('[data-testid="url-input"]')
    await urlInput.setValue('not-a-url')
    const addBtn = wrapper.find('[data-testid="add-url-btn"]')
    await addBtn.trigger('click')
    expect(store.webImageUrls.length).toBe(0)
  })

  it('shows conflict warning when both sources exist', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    store.addLocalImage({ file: createImageFile(), previewUrl: 'blob:preview1' })
    store.addWebImageUrl('https://example.com/image.png')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="mix-conflict-warning"]').exists()).toBe(true)
  })

  it('no conflict warning when only local images', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    store.addLocalImage({ file: createImageFile(), previewUrl: 'blob:preview1' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="mix-conflict-warning"]').exists()).toBe(false)
  })

  it('removes web URL on click', async () => {
    const wrapper = mountReferenceImages()
    const store = useGenerationParamsStore()
    store.addWebImageUrl('https://example.com/image.png')
    await wrapper.vm.$nextTick()
    const removeBtn = wrapper.find('[data-testid="web-url-list"] button')
    await removeBtn.trigger('click')
    expect(store.webImageUrls.length).toBe(0)
  })
})

describe('MaskImageInput (Step 19)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders upload mask button', () => {
    const wrapper = mountMaskImageInput()
    expect(wrapper.find('[data-testid="upload-mask-btn"]').exists()).toBe(true)
  })

  it('renders mask URL input', () => {
    const wrapper = mountMaskImageInput()
    expect(wrapper.find('[data-testid="mask-url-input"]').exists()).toBe(true)
  })

  it('sets mask from file input', async () => {
    const wrapper = mountMaskImageInput()
    const store = useGenerationParamsStore()
    const file = createImageFile('mask.png')
    const input = wrapper.find('[data-testid="mask-file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    expect(store.maskImage).not.toBeNull()
    expect(store.maskImage?.file).toBe(file)
  })

  it('sets mask from URL', async () => {
    const wrapper = mountMaskImageInput()
    const store = useGenerationParamsStore()
    const urlInput = wrapper.find('[data-testid="mask-url-input"]')
    await urlInput.setValue('https://example.com/mask.png')
    const setBtn = wrapper.find('[data-testid="set-mask-url-btn"]')
    await setBtn.trigger('click')
    expect(store.maskImage).not.toBeNull()
    expect(store.maskImage?.url).toBe('https://example.com/mask.png')
  })

  it('clears mask on clear button click', async () => {
    const wrapper = mountMaskImageInput()
    const store = useGenerationParamsStore()
    store.setMaskImage({ url: 'https://example.com/mask.png' })
    await wrapper.vm.$nextTick()
    const clearBtn = wrapper.find('[data-testid="clear-mask-btn"]')
    await clearBtn.trigger('click')
    expect(store.maskImage).toBeNull()
  })

  it('shows preview when mask is set', async () => {
    const wrapper = mountMaskImageInput()
    const store = useGenerationParamsStore()
    store.setMaskImage({ url: 'https://example.com/mask.png' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="mask-preview"]').exists()).toBe(true)
  })

  it('hides upload area when mask is set', async () => {
    const wrapper = mountMaskImageInput()
    const store = useGenerationParamsStore()
    store.setMaskImage({ url: 'https://example.com/mask.png' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="upload-mask-btn"]').exists()).toBe(false)
  })
})
