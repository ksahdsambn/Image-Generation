import 'fake-indexeddb/auto'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import { clearHistory, historyDb, listHistory } from '@/storage/historyDb'

function toBase64(bytes: number[]) {
  return btoa(String.fromCharCode(...bytes))
}

function successResponse() {
  return new Response(JSON.stringify({ data: [{ b64_json: toBase64([0x89, 0x50, 0x4e, 0x47]) }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function mountApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(App, {
    global: {
      plugins: [pinia],
    },
  })
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function waitForWorkflow() {
  await vi.waitFor(() => {
    expect(fetch).toHaveBeenCalled()
  })
  await flush()
}

describe('App generation workflow', () => {
  const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}-${blob.size}-${createObjectURL.mock.calls.length}`)
  const revokeObjectURL = vi.fn()
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(async () => {
    vi.stubEnv('VITE_SUB2API_BASE_URL', 'https://sub2api.example.com')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successResponse()))
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    })
    localStorage.clear()
    sessionStorage.clear()
    await clearHistory(historyDb)
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  afterEach(async () => {
    await clearHistory(historyDb)
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: originalCreateObjectURL },
      revokeObjectURL: { configurable: true, value: originalRevokeObjectURL },
    })
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('integrates text-to-image success into current results and history', async () => {
    const wrapper = mountApp()

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')
    await wrapper.get('form[aria-label="Generation parameters"]').trigger('submit')
    await waitForWorkflow()

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://sub2api.example.com/v1/images/generations')
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: 'gpt-image-2',
      response_format: 'b64_json',
      prompt: 'A studio portrait',
    })
    await vi.waitFor(() => {
      expect(wrapper.find('img[alt^="Generated image"]').exists()).toBe(true)
    })
    await vi.waitFor(async () => {
      expect(await listHistory({ limit: 10 }, historyDb)).toHaveLength(1)
    })
  })

  it('integrates local reference image edits through multipart requests', async () => {
    const wrapper = mountApp()
    const file = new File(['reference'], 'reference.png', { type: 'image/png' })
    const input = wrapper.get('input[aria-label="Reference images"]')

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('textarea[aria-label="Prompt"]').setValue('Improve this image')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await wrapper.get('form[aria-label="Generation parameters"]').trigger('submit')
    await waitForWorkflow()

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    const body = init?.body as FormData

    expect(url).toBe('https://sub2api.example.com/v1/images/edits')
    expect(body.get('model')).toBe('gpt-image-2')
    expect(body.get('prompt')).toBe('Improve this image')
    expect(body.get('image')).toBeInstanceOf(File)
    await vi.waitFor(async () => {
      expect(await listHistory({ limit: 10 }, historyDb)).toHaveLength(1)
    })
  })

  it('integrates URL edit and mask URL through JSON edits requests', async () => {
    const wrapper = mountApp()

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('textarea[aria-label="Prompt"]').setValue('Use this URL')
    await wrapper.get('input[aria-label="Image URL"]').setValue('https://example.com/image.png')
    const addButton = wrapper.findAll('button').find((button) => button.text() === 'Add')
    await addButton?.trigger('click')
    await wrapper.get('input[aria-label="Mask URL"]').setValue('https://example.com/mask.png')
    await wrapper.get('form[aria-label="Generation parameters"]').trigger('submit')
    await waitForWorkflow()

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(init?.body as string)

    expect(url).toBe('https://sub2api.example.com/v1/images/edits')
    expect(body.images).toEqual([{ image_url: 'https://example.com/image.png' }])
    expect(body.mask).toEqual({ image_url: 'https://example.com/mask.png' })
  })

  it('does not send requests without API Key', async () => {
    const wrapper = mountApp()

    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')
    await wrapper.get('form[aria-label="Generation parameters"]').trigger('submit')
    await flush()

    expect(fetch).not.toHaveBeenCalled()
    expect(await listHistory({ limit: 10 }, historyDb)).toHaveLength(0)
  })

  it('does not write history when the API request fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad key' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const wrapper = mountApp()

    await wrapper.get('input[aria-label="Sub2API API Key"]').setValue('sk-component')
    await wrapper.get('textarea[aria-label="Prompt"]').setValue('A studio portrait')
    await wrapper.get('form[aria-label="Generation parameters"]').trigger('submit')
    await waitForWorkflow()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('API Key 无效或已失效')
    })
    expect(await listHistory({ limit: 10 }, historyDb)).toHaveLength(0)
  })
})
