import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGenerationParamsStore } from '@/stores/generationParamsStore'
import { IMAGE_MODEL, IMAGE_RESPONSE_FORMAT } from '@/types/generation'

describe('generation params store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes and updates centralized generation state', () => {
    const store = useGenerationParamsStore()

    store.setPrompt('  A quiet studio  ')
    store.setSize('1536x1024')
    store.setCount(3)
    store.setQuality('high')
    store.setBackground('transparent')

    expect(store.trimmedPrompt).toBe('A quiet studio')
    expect(store.size).toBe('1536x1024')
    expect(store.count).toBe(3)
    expect(store.quality).toBe('high')
    expect(store.background).toBe('transparent')
  })

  it('normalizes request-facing params with fixed model and b64_json response format', () => {
    const store = useGenerationParamsStore()

    store.setPrompt('A clean product photo')

    expect(store.normalizedParams).toMatchObject({
      model: IMAGE_MODEL,
      response_format: IMAGE_RESPONSE_FORMAT,
      prompt: 'A clean product photo',
      output_format: 'webp',
      output_compression: 80,
    })
  })

  it('blocks empty prompts from submit params', () => {
    const store = useGenerationParamsStore()

    store.setPrompt('   ')

    expect(store.canSubmit).toBe(false)
    expect(store.validation.ok).toBe(false)
    expect(store.validation.errors[0]).toContain('Prompt')
  })

  it('prevents unsupported size and out-of-range count values', () => {
    const store = useGenerationParamsStore()

    store.setSize('1536x1024')
    store.setSize('4096x4096')
    store.setCount(99)

    expect(store.size).toBe('1536x1024')
    expect(store.count).toBe(4)
  })

  it('omits compression when output format does not support it', () => {
    const store = useGenerationParamsStore()

    store.setPrompt('A transparent icon')
    store.setOutputFormat('png')

    expect(store.outputCompression).toBeNull()
    expect(store.normalizedParams).not.toHaveProperty('output_compression')
  })

  it('keeps local file inputs separate from remote URL inputs', () => {
    const store = useGenerationParamsStore()
    const file = new File(['image'], 'reference.png', { type: 'image/png' })

    expect(store.addReferenceImage(file)).toBe(true)
    store.addImageUrl('https://example.com/reference.png')
    store.setPrompt('Blend the references')

    expect(store.validation.ok).toBe(false)
    expect(store.validation.errors[0]).toContain('either local reference images or image URLs')
  })

  it('resets params without touching unrelated stores', () => {
    const store = useGenerationParamsStore()

    store.setPrompt('A prompt')
    store.setCount(3)
    store.setOutputFormat('png')
    store.resetParams()

    expect(store.prompt).toBe('')
    expect(store.count).toBe(1)
    expect(store.outputFormat).toBe('webp')
    expect(store.outputCompression).toBe(80)
  })
})
