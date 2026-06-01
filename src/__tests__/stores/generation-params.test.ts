import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenerationParamsStore } from '../../stores/generation-params'
import { MODEL, RESPONSE_FORMAT } from '../../types/generation'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useGenerationParamsStore', () => {
  it('initializes with default values', () => {
    const store = useGenerationParamsStore()
    expect(store.prompt).toBe('')
    expect(store.size).toBe('auto')
    expect(store.n).toBe(1)
    expect(store.quality).toBe('auto')
    expect(store.background).toBe('auto')
    expect(store.outputFormat).toBe('png')
    expect(store.outputCompression).toBe(null)
    expect(store.localImages).toEqual([])
    expect(store.webImageUrls).toEqual([])
    expect(store.maskImage).toBe(null)
  })

  it('rejects invalid size', () => {
    const store = useGenerationParamsStore()
    store.setSize('512x512')
    expect(store.size).toBe('auto')
  })

  it('accepts valid size', () => {
    const store = useGenerationParamsStore()
    store.setSize('1536x1024')
    expect(store.size).toBe('1536x1024')
  })

  it('rejects count below minimum', () => {
    const store = useGenerationParamsStore()
    store.setCount(0)
    expect(store.n).toBe(1)
  })

  it('rejects count above maximum', () => {
    const store = useGenerationParamsStore()
    store.setCount(11)
    expect(store.n).toBe(1)
  })

  it('accepts valid count', () => {
    const store = useGenerationParamsStore()
    store.setCount(5)
    expect(store.n).toBe(5)
  })

  it('accepts medium quality', () => {
    const store = useGenerationParamsStore()
    store.setQuality('medium')
    expect(store.quality).toBe('medium')
  })

  it('rejects invalid quality', () => {
    const store = useGenerationParamsStore()
    store.setQuality('standard')
    expect(store.quality).toBe('auto')
  })

  it('rejects invalid background', () => {
    const store = useGenerationParamsStore()
    store.setBackground('white')
    expect(store.background).toBe('auto')
  })

  it('rejects invalid output format', () => {
    const store = useGenerationParamsStore()
    store.setOutputFormat('gif')
    expect(store.outputFormat).toBe('png')
  })

  it('clears compression when format changes to png', () => {
    const store = useGenerationParamsStore()
    store.setOutputFormat('webp')
    store.setOutputCompression(60)
    store.setOutputFormat('png')
    expect(store.outputCompression).toBe(null)
  })

  it('enables compression when format changes to webp', () => {
    const store = useGenerationParamsStore()
    store.setOutputFormat('png')
    expect(store.outputCompression).toBe(null)
    store.setOutputFormat('webp')
    expect(store.outputCompression).toBe(80)
  })

  it('compressionEnabled is true for webp', () => {
    const store = useGenerationParamsStore()
    store.setOutputFormat('webp')
    expect(store.compressionEnabled).toBe(true)
  })

  it('compressionEnabled is false for png', () => {
    const store = useGenerationParamsStore()
    store.setOutputFormat('png')
    expect(store.compressionEnabled).toBe(false)
  })

  it('promptError returns error for empty prompt', () => {
    const store = useGenerationParamsStore()
    expect(store.promptError).toContain('不能为空')
  })

  it('promptError returns null for valid prompt', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'A cat'
    expect(store.promptError).toBeNull()
  })

  it('canSubmit is false when prompt is empty', () => {
    const store = useGenerationParamsStore()
    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit is true when prompt is valid', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'A beautiful landscape'
    expect(store.canSubmit).toBe(true)
  })

  it('canSubmit is false when mixed ref sources', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    store.addLocalImage({ file: new File([], 'test.png', { type: 'image/png' }), previewUrl: 'blob:test' })
    store.addWebImageUrl('https://example.com/img.png')
    expect(store.hasMixedRefSources).toBe(true)
    expect(store.canSubmit).toBe(false)
  })

  it('addLocalImage and removeLocalImage work correctly', () => {
    const store = useGenerationParamsStore()
    const img = { file: new File([], 'test.png', { type: 'image/png' }), previewUrl: 'blob:test' }
    store.addLocalImage(img)
    expect(store.localImages).toHaveLength(1)
    store.removeLocalImage(0)
    expect(store.localImages).toHaveLength(0)
  })

  it('clearLocalImages removes all images', () => {
    const store = useGenerationParamsStore()
    store.addLocalImage({ file: new File([], 'a.png', { type: 'image/png' }), previewUrl: 'blob:a' })
    store.addLocalImage({ file: new File([], 'b.png', { type: 'image/png' }), previewUrl: 'blob:b' })
    store.clearLocalImages()
    expect(store.localImages).toHaveLength(0)
  })

  it('addWebImageUrl and removeWebImageUrl work correctly', () => {
    const store = useGenerationParamsStore()
    store.addWebImageUrl('https://example.com/img.png')
    expect(store.webImageUrls).toHaveLength(1)
    expect(store.webImageUrls[0].url).toBe('https://example.com/img.png')
    store.removeWebImageUrl(0)
    expect(store.webImageUrls).toHaveLength(0)
  })

  it('clearWebImageUrls removes all URLs', () => {
    const store = useGenerationParamsStore()
    store.addWebImageUrl('https://a.com/img.png')
    store.addWebImageUrl('https://b.com/img.png')
    store.clearWebImageUrls()
    expect(store.webImageUrls).toHaveLength(0)
  })

  it('setMaskImage works correctly', () => {
    const store = useGenerationParamsStore()
    const mask = { file: new File([], 'mask.png', { type: 'image/png' }), previewUrl: 'blob:mask' }
    store.setMaskImage(mask)
    expect(store.maskImage).toEqual(mask)
    store.setMaskImage(null)
    expect(store.maskImage).toBe(null)
  })

  it('buildRequestBody returns null for empty prompt', () => {
    const store = useGenerationParamsStore()
    expect(store.buildRequestBody()).toBe(null)
  })

  it('buildRequestBody always includes gpt-image-2 model', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    const body = store.buildRequestBody()
    expect(body).not.toBeNull()
    expect(body!.model).toBe(MODEL)
    expect(body!.model).toBe('gpt-image-2')
  })

  it('buildRequestBody always includes b64_json response_format', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    const body = store.buildRequestBody()
    expect(body!.response_format).toBe(RESPONSE_FORMAT)
    expect(body!.response_format).toBe('b64_json')
  })

  it('buildRequestBody trims prompt whitespace', () => {
    const store = useGenerationParamsStore()
    store.prompt = '  hello world  '
    const body = store.buildRequestBody()
    expect(body!.prompt).toBe('hello world')
  })

  it('buildRequestBody omits n because API requests are single-image', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    store.setCount(3)
    const body = store.buildRequestBody()
    expect(body).not.toHaveProperty('n')
  })

  it('buildRequestBody does not include compression for png', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    store.setOutputFormat('png')
    const body = store.buildRequestBody()
    expect(body).not.toHaveProperty('output_compression')
  })

  it('buildRequestBody includes compression for webp', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'Test'
    store.setOutputFormat('webp')
    store.setOutputCompression(60)
    const body = store.buildRequestBody()
    expect(body!.output_compression).toBe(60)
  })

  it('resetParams restores defaults', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'changed'
    store.setSize('1536x1024')
    store.setCount(5)
    store.setOutputFormat('webp')
    store.addLocalImage({ file: new File([], 'a.png', { type: 'image/png' }), previewUrl: 'blob:a' })
    store.addWebImageUrl('https://example.com/img.png')
    store.resetParams()
    expect(store.prompt).toBe('')
    expect(store.size).toBe('auto')
    expect(store.n).toBe(1)
    expect(store.outputFormat).toBe('png')
    expect(store.localImages).toHaveLength(0)
    expect(store.webImageUrls).toHaveLength(0)
  })

  it('resetParams does not affect API Key store', () => {
    const store = useGenerationParamsStore()
    store.prompt = 'test'
    store.resetParams()
    expect(store.prompt).toBe('')
  })
})
