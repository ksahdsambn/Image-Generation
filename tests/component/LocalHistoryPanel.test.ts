import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LocalHistoryPanel from '@/components/LocalHistoryPanel.vue'
import type { ImageHistoryListItem } from '@/types/history'

function createItem(id = 'history-1'): ImageHistoryListItem {
  return {
    id,
    thumbnailBlob: new Blob([new Uint8Array([1])], { type: 'image/png' }),
    prompt: `Prompt ${id}`,
    params: { prompt: `Prompt ${id}`, model: 'gpt-image-2' },
    model: 'gpt-image-2',
    size: '1024x1024',
    quality: 'auto',
    outputFormat: 'png',
    createdAt: 1000,
    byteSize: 10,
  }
}

describe('LocalHistoryPanel', () => {
  const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}-${blob.size}`)
  const revokeObjectURL = vi.fn()
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
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

  it('shows a storage degradation notice when IndexedDB is unavailable', () => {
    const wrapper = mount(LocalHistoryPanel, {
      props: { items: [], unavailable: true },
    })

    expect(wrapper.text()).toContain('Local history is unavailable')
    expect(wrapper.text()).toContain('Current results can still be previewed and downloaded')
  })

  it('renders local history records without exposing API Key fields', () => {
    const wrapper = mount(LocalHistoryPanel, {
      props: { items: [createItem()] },
    })

    expect(wrapper.text()).toContain('Prompt history-1')
    expect(wrapper.text()).not.toContain('apiKey')
    expect(wrapper.text()).not.toContain('Authorization')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('emits search, date, reload, download, delete, and clear operations', async () => {
    const wrapper = mount(LocalHistoryPanel, {
      props: { items: [createItem()] },
    })

    await wrapper.get('input[aria-label="Search local history"]').setValue('studio')
    await wrapper.get('input[aria-label="Filter local history date"]').setValue('2026-05-29')
    await wrapper.get('button[aria-label="Reload history-1"]').trigger('click')
    await wrapper.get('button[aria-label="Download history-1"]').trigger('click')
    await wrapper.get('button[aria-label="Delete history-1"]').trigger('click')
    await wrapper.get('button[aria-label="Clear local history"]').trigger('click')

    expect(wrapper.emitted('search')?.[0]).toEqual(['studio'])
    expect(wrapper.emitted('date')?.[0]).toEqual(['2026-05-29'])
    expect(wrapper.emitted('reload')?.[0]?.[0]).toMatchObject({ id: 'history-1' })
    expect(wrapper.emitted('download')?.[0]?.[0]).toMatchObject({ id: 'history-1' })
    expect(wrapper.emitted('delete')?.[0]).toEqual(['history-1'])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('releases thumbnail object URLs when records change and on unmount', async () => {
    const wrapper = mount(LocalHistoryPanel, {
      props: { items: [createItem('one')] },
    })

    await wrapper.setProps({ items: [createItem('two')] })
    wrapper.unmount()

    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })
})
