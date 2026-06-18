import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResultGrid from '@/components/ResultGrid.vue'
import { useGenerationStore } from '@/stores/generation'
import type { ParsedImageResult } from '@/types/api'
import { AppErrorCode, type AppError } from '@/types/errors'
import { createI18nForTest } from '@/__tests__/helpers/i18n'

let pinia: ReturnType<typeof createPinia>

function mountResultGrid() {
  return mount(ResultGrid, {
    global: { plugins: [pinia, createI18nForTest()] },
  })
}

function createMockResult(index = 0): ParsedImageResult {
  const blob = new Blob(['fake-image-data'], { type: 'image/png' })
  return {
    blob,
    mimeType: 'image/png',
    revisedPrompt: `revised prompt ${index}`,
    objectUrl: `blob:mock-url-${index}`,
  }
}

describe('ResultGrid (Step 20)', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('shows empty state when no results', () => {
    const wrapper = mountResultGrid()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('暂无生成结果')
  })

  it('shows error state when error is set', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    const error: AppError = {
      code: AppErrorCode.AUTH_FAILED,
      userMessage: 'API Key 无效或已失效',
      debugHint: '',
    }
    store.setError(error)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('API Key 无效')
  })

  it('shows loading state during generation', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setGenerating(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('生成中')
  })

  it('shows result grid with results', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0), createMockResult(1)])
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="result-images"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="download-result-btn"]').length).toBe(2)
  })

  it('shows download all button when results exist', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0)])
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="download-all-btn"]').exists()).toBe(true)
  })

  it('removes result on remove button click', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0), createMockResult(1)])
    await wrapper.vm.$nextTick()
    const removeBtns = wrapper.findAll('[data-testid="remove-result-btn"]')
    await removeBtns[0].trigger('click')
    expect(store.currentResults.length).toBe(1)
  })

  it('download buttons have accessible labels', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0)])
    await wrapper.vm.$nextTick()
    const downloadBtn = wrapper.find('[data-testid="download-result-btn"]')
    expect(downloadBtn.attributes('aria-label')).toBeTruthy()
  })

  it('copy buttons have accessible labels', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0)])
    await wrapper.vm.$nextTick()
    const copyBtn = wrapper.find('[data-testid="copy-result-btn"]')
    expect(copyBtn.attributes('aria-label')).toBeTruthy()
  })

  it('removing result does not affect history', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0)])
    await wrapper.vm.$nextTick()
    const removeBtn = wrapper.find('[data-testid="remove-result-btn"]')
    await removeBtn.trigger('click')
    expect(store.currentResults.length).toBe(0)
  })

  it('shows revised prompt when available', async () => {
    const wrapper = mountResultGrid()
    const store = useGenerationStore()
    store.setResults([createMockResult(0)])
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('revised prompt 0')
  })
})
