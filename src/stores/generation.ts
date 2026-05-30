import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedImageResult } from '@/types/api'
import type { AppError } from '@/types/errors'

export const useGenerationStore = defineStore('generation', () => {
  const isGenerating = ref(false)
  const currentResults = ref<ParsedImageResult[]>([])
  const error = ref<AppError | null>(null)
  const lastGenerationTime = ref<number | null>(null)

  const hasResults = computed(() => currentResults.value.length > 0)

  function _releaseResults(results: ParsedImageResult[]) {
    for (const r of results) {
      if (r.objectUrl) {
        try { URL.revokeObjectURL(r.objectUrl) } catch { /* ignore */ }
      }
    }
  }

  function clearResults() {
    _releaseResults(currentResults.value)
    currentResults.value = []
  }

  function removeResult(index: number) {
    if (index >= 0 && index < currentResults.value.length) {
      const r = currentResults.value[index]
      if (r.objectUrl) {
        try { URL.revokeObjectURL(r.objectUrl) } catch { /* ignore */ }
      }
      currentResults.value.splice(index, 1)
    }
  }

  function setResults(results: ParsedImageResult[]) {
    _releaseResults(currentResults.value)
    currentResults.value = results
    lastGenerationTime.value = Date.now()
  }

  function setError(err: AppError | null) {
    error.value = err
  }

  function setGenerating(value: boolean) {
    isGenerating.value = value
    if (value) error.value = null
  }

  function clearAll() {
    _releaseResults(currentResults.value)
    currentResults.value = []
    error.value = null
    lastGenerationTime.value = null
  }

  return {
    isGenerating,
    currentResults,
    error,
    lastGenerationTime,
    hasResults,
    clearResults,
    removeResult,
    setResults,
    setError,
    setGenerating,
    clearAll,
  }
})
