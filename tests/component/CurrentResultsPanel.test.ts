import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CurrentResultsPanel from '@/components/CurrentResultsPanel.vue'
import type { ConvertedImageResult } from '@/utils/imageResult'

function createImage(id = 'image-1'): ConvertedImageResult {
  return {
    id,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }),
    mimeType: 'image/png',
    extension: 'png',
    fileName: `${id}.png`,
  }
}

describe('CurrentResultsPanel', () => {
  const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}-${blob.size}`)
  const revokeObjectURL = vi.fn()
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: createObjectURL,
      },
      revokeObjectURL: {
        configurable: true,
        value: revokeObjectURL,
      },
    })
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  afterEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: originalCreateObjectURL,
      },
      revokeObjectURL: {
        configurable: true,
        value: originalRevokeObjectURL,
      },
    })
    vi.unstubAllGlobals()
  })

  it('renders an empty state when there are no results', () => {
    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [] },
    })

    expect(wrapper.text()).toContain('Generated images will appear here')
    expect(wrapper.get('button[aria-label="Download all current results"]').attributes('disabled')).toBeDefined()
  })

  it('creates preview URLs for current result images', () => {
    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [createImage()] },
    })

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(wrapper.get('img').attributes('src')).toBe('blob:image/png-3')
    expect(wrapper.text()).toContain('Download all')
  })

  it('revokes object URLs when images change and on unmount', async () => {
    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [createImage('first')] },
    })

    await wrapper.setProps({ images: [createImage('second')] })
    wrapper.unmount()

    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('emits remove without deleting history data', async () => {
    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [createImage()] },
    })

    await wrapper.get('button[aria-label="Remove image-1.png"]').trigger('click')

    expect(wrapper.emitted('remove')?.[0]).toEqual(['image-1'])
  })

  it('starts downloads for single and all current results', async () => {
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        element.click = click
      }
      return element
    })
    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [createImage('first'), createImage('second')] },
    })

    await wrapper.get('button[aria-label="Download first.png"]').trigger('click')
    await wrapper.get('button[aria-label="Download all current results"]').trigger('click')

    expect(click).toHaveBeenCalledTimes(3)
    createElement.mockRestore()
  })

  it('shows copy success and failure notices', async () => {
    class ClipboardItemMock {
      constructor(public items: Record<string, Blob>) {}
    }

    const write = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('ClipboardItem', ClipboardItemMock)
    Object.defineProperty(navigator, 'clipboard', {
      value: { write },
      configurable: true,
    })

    const wrapper = mount(CurrentResultsPanel, {
      props: { images: [createImage()] },
    })

    await wrapper.get('button[aria-label="Copy image-1.png"]').trigger('click')
    expect(write).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Image copied to clipboard')

    write.mockRejectedValueOnce(new Error('denied'))
    await wrapper.get('button[aria-label="Copy image-1.png"]').trigger('click')
    expect(wrapper.text()).toContain('Download the image instead')
  })
})
