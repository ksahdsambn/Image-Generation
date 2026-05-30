import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HistoryPanel from '@/components/HistoryPanel.vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { checkStorageAvailability } from '@/storage/storage-availability'
import { queryHistory, getHistoryById } from '@/storage/history-reader'
import { deleteHistoryRecord, clearAllHistory } from '@/storage/history-deleter'
import type { HistoryRecord } from '@/types/history'

vi.mock('@/storage/storage-availability')
vi.mock('@/storage/history-reader')
vi.mock('@/storage/history-deleter')

let pinia: ReturnType<typeof createPinia>

function mountHistoryPanel() {
  return mount(HistoryPanel, {
    global: {
      plugins: [pinia],
      stubs: { teleport: true },
    },
  })
}

function createMockRecord(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: 1,
    imageBlob: new Blob(['fake'], { type: 'image/png' }),
    thumbnailBlob: new Blob(['thumb'], { type: 'image/png' }),
    prompt: 'test prompt',
    revisedPrompt: null,
    model: 'gpt-image-2',
    size: '1024x1024',
    quality: 'auto',
    background: 'auto',
    outputFormat: 'png',
    outputCompression: null,
    n: 1,
    requestMode: 'generations',
    imageBytes: 1024,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('HistoryPanel (Step 21)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    vi.mocked(checkStorageAvailability).mockResolvedValue({ available: true })
    vi.mocked(queryHistory).mockResolvedValue({
      records: [],
      total: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    vi.mocked(getHistoryById).mockResolvedValue(undefined)
    vi.mocked(deleteHistoryRecord).mockResolvedValue(true)
    vi.mocked(clearAllHistory).mockResolvedValue(undefined)
  })

  it('renders search input', async () => {
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
  })

  it('renders date filters', async () => {
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.find('[data-testid="start-date"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="end-date"]').exists()).toBe(true)
  })

  it('shows empty state when no records', async () => {
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.find('[data-testid="history-empty"]').exists()).toBe(true)
  })

  it('shows local storage hint', async () => {
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.text()).toContain('仅保存在当前浏览器本地')
  })

  it('shows clear all button when history has records', async () => {
    vi.mocked(queryHistory).mockResolvedValue({
      records: [createMockRecord()],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.find('[data-testid="clear-all-btn"]').exists()).toBe(true)
  })

  it('reloads params on reload button click', async () => {
    vi.mocked(queryHistory).mockResolvedValue({
      records: [createMockRecord({
        prompt: 'beautiful sunset',
        size: '1536x1024',
        quality: 'high',
      })],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    const wrapper = mountHistoryPanel()
    await flushPromises()
    const store = useGenerationParamsStore()
    const reloadBtn = wrapper.find('[data-testid="reload-params-btn"]')
    expect(reloadBtn.exists()).toBe(true)
    await reloadBtn.trigger('click')
    expect(store.prompt).toBe('beautiful sunset')
    expect(store.size).toBe('1536x1024')
    expect(store.quality).toBe('high')
  })

  it('deletes record on confirm', async () => {
    vi.mocked(queryHistory).mockResolvedValue({
      records: [createMockRecord()],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    window.confirm = vi.fn().mockReturnValue(true)
    const wrapper = mountHistoryPanel()
    await flushPromises()
    const deleteBtn = wrapper.find('[data-testid="delete-history-btn"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    expect(window.confirm).toHaveBeenCalled()
    expect(deleteHistoryRecord).toHaveBeenCalledWith(1)
  })

  it('does not delete if user cancels confirm', async () => {
    vi.mocked(queryHistory).mockResolvedValue({
      records: [createMockRecord()],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    window.confirm = vi.fn().mockReturnValue(false)
    const wrapper = mountHistoryPanel()
    await flushPromises()
    const deleteBtn = wrapper.find('[data-testid="delete-history-btn"]')
    await deleteBtn.trigger('click')
    expect(deleteHistoryRecord).not.toHaveBeenCalled()
  })

  it('clears all history on confirm', async () => {
    vi.mocked(queryHistory).mockResolvedValue({
      records: [createMockRecord()],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    window.confirm = vi.fn().mockReturnValue(true)
    const wrapper = mountHistoryPanel()
    await flushPromises()
    const clearBtn = wrapper.find('[data-testid="clear-all-btn"]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    expect(window.confirm).toHaveBeenCalled()
    expect(clearAllHistory).toHaveBeenCalled()
  })

  it('shows storage unavailable message when storage fails', async () => {
    vi.mocked(checkStorageAvailability).mockResolvedValue({
      available: false,
      message: 'IndexedDB 不可用',
    })
    const wrapper = mountHistoryPanel()
    await flushPromises()
    expect(wrapper.find('[data-testid="storage-unavailable"]').exists()).toBe(true)
  })

  it('search input triggers search on enter', async () => {
    const wrapper = mountHistoryPanel()
    await flushPromises()
    const searchInput = wrapper.find('[data-testid="search-input"]')
    await searchInput.setValue('sunset')
    await searchInput.trigger('keydown.enter')
    expect(queryHistory).toHaveBeenCalled()
  })
})
