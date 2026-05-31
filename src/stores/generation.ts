import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedImageResult } from '@/types/api'
import type { AppError } from '@/types/errors'
import { createValidationError, sanitizeText } from '@/types/errors'
import { decideRequestMode } from '@/services/image-api'
import type { GenerationsParams, EditsMultipartParams, EditsJsonParams } from '@/services/image-api'
import { sendGenerationsRequest, sendEditsMultipartRequest, sendEditsJsonRequest } from '@/services/image-api'
import { parseApiResponse } from '@/services/response-parser'
import { writeMultipleHistory } from '@/storage/history-writer'
import { enforceHistoryLimits } from '@/storage/history-cleaner'
import type { LocalImage, WebImageUrl } from '@/types/generation'
import type { useApiKeyStore } from '@/stores/api-key'
import type { useGenerationParamsStore } from '@/stores/generation-params'

export const useGenerationStore = defineStore('generation', () => {
  const isGenerating = ref(false)
  const currentResults = ref<ParsedImageResult[]>([])
  const error = ref<AppError | null>(null)
  const lastGenerationTime = ref<number | null>(null)
  const storageWarning = ref<AppError | null>(null)

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
    storageWarning.value = null
  }

  async function generate(
    apiKeyStore: ReturnType<typeof useApiKeyStore>,
    paramsStore: ReturnType<typeof useGenerationParamsStore>,
    fetchFn?: typeof fetch,
  ): Promise<boolean> {
    const apiKey = apiKeyStore.apiKey.trim()
    if (!apiKey) {
      error.value = createValidationError('缺少 API Key')
      return false
    }

    const trimmedPrompt = paramsStore.prompt.trim()
    if (!trimmedPrompt) {
      error.value = createValidationError('Prompt 不能为空')
      return false
    }

    const mode = decideRequestMode(paramsStore.localImages, paramsStore.webImageUrls)
    if (mode === 'conflict') {
      error.value = createValidationError('不能同时使用本地上传和网页图片 URL，请选择其中一种')
      return false
    }

    if (mode === 'generations' && paramsStore.maskImage) {
      error.value = createValidationError('遮罩图必须与参考图一起使用')
      return false
    }
    if (mode === 'edits-multipart' && paramsStore.maskImage?.url) {
      error.value = createValidationError('本地参考图只能搭配本地遮罩图')
      return false
    }
    if (mode === 'edits-json' && paramsStore.maskImage?.file) {
      error.value = createValidationError('网页图片 URL 只能搭配遮罩图 URL')
      return false
    }

    isGenerating.value = true
    error.value = null
    storageWarning.value = null

    try {
      let apiResponse

      if (mode === 'generations') {
        const params: GenerationsParams = {
          prompt: trimmedPrompt,
          size: paramsStore.size,
          n: paramsStore.n,
          quality: paramsStore.quality,
          background: paramsStore.background,
          output_format: paramsStore.outputFormat,
          output_compression: paramsStore.compressionEnabled ? paramsStore.outputCompression : null,
        }
        apiResponse = fetchFn
          ? await sendGenerationsRequest(apiKey, params, fetchFn)
          : await sendGenerationsRequest(apiKey, params)
      } else if (mode === 'edits-multipart') {
        const images = paramsStore.localImages.map((img: LocalImage) => img.file)
        const maskFile = paramsStore.maskImage?.file
        const params: EditsMultipartParams = {
          prompt: trimmedPrompt,
          images,
          mask: maskFile,
          size: paramsStore.size,
          n: paramsStore.n,
          quality: paramsStore.quality,
          background: paramsStore.background,
          output_format: paramsStore.outputFormat,
          output_compression: paramsStore.compressionEnabled ? paramsStore.outputCompression : null,
        }
        apiResponse = fetchFn
          ? await sendEditsMultipartRequest(apiKey, params, fetchFn)
          : await sendEditsMultipartRequest(apiKey, params)
      } else {
        const imageUrls = paramsStore.webImageUrls.map((item: WebImageUrl) => item.url)
        const maskUrl = paramsStore.maskImage?.url
        const params: EditsJsonParams = {
          prompt: trimmedPrompt,
          imageUrls,
          maskUrl,
          size: paramsStore.size,
          n: paramsStore.n,
          quality: paramsStore.quality,
          background: paramsStore.background,
          output_format: paramsStore.outputFormat,
          output_compression: paramsStore.compressionEnabled ? paramsStore.outputCompression : null,
        }
        apiResponse = fetchFn
          ? await sendEditsJsonRequest(apiKey, params, fetchFn)
          : await sendEditsJsonRequest(apiKey, params)
      }

      const parsedResults = parseApiResponse(apiResponse, paramsStore.outputFormat)
      if (parsedResults.length === 0) {
        error.value = createValidationError('生成结果为空，请重试')
        return false
      }

      _releaseResults(currentResults.value)
      currentResults.value = parsedResults

      const writeResult = await writeMultipleHistory(
        parsedResults.map((r) => ({
          imageBlob: r.blob,
          revisedPrompt: r.revisedPrompt ?? null,
        })),
        {
          prompt: trimmedPrompt,
          model: 'gpt-image-2',
          size: paramsStore.size,
          quality: paramsStore.quality,
          background: paramsStore.background,
          outputFormat: paramsStore.outputFormat,
          outputCompression: paramsStore.compressionEnabled ? paramsStore.outputCompression : null,
          n: paramsStore.n,
          requestMode: mode,
        },
      )

      if (writeResult.failureCount > 0 && writeResult.errors.length > 0) {
        if (writeResult.failureCount === parsedResults.length) {
          storageWarning.value = {
            code: 'STORAGE_ERROR',
            userMessage: '图片已生成，但保存到本地历史失败，请立即下载。可尝试清空历史记录后重新生成。',
            debugHint: 'All writes failed',
          }
        } else {
          storageWarning.value = writeResult.errors[0]
        }
      } else if (writeResult.failureCount > 0) {
        storageWarning.value = writeResult.errors[0]
      }

      await enforceHistoryLimits()

      lastGenerationTime.value = Date.now()

      return true
    } catch (err: unknown) {
      const appError = err as AppError
      if (appError && 'code' in appError && 'userMessage' in appError) {
        error.value = appError
      } else {
        error.value = {
          code: 'UNKNOWN_ERROR',
          userMessage: '发生未知错误，请稍后重试',
          debugHint: sanitizeText(String(err), [apiKey]),
        }
      }
      return false
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    currentResults,
    error,
    lastGenerationTime,
    storageWarning,
    hasResults,
    clearResults,
    removeResult,
    setResults,
    setError,
    setGenerating,
    clearAll,
    generate,
  }
})
