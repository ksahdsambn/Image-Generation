import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ApiResponse, ParsedImageResult } from '@/types/api'
import type { AppError } from '@/types/errors'
import { createValidationError, sanitizeText } from '@/types/errors'
import { decideRequestMode } from '@/services/image-api'
import type { EditsJsonParams, EditsMultipartParams, GenerationsParams } from '@/services/image-api'
import { sendEditsJsonRequest, sendEditsMultipartRequest, sendGenerationsRequest } from '@/services/image-api'
import { parseApiResponse } from '@/services/response-parser'
import { enforceHistoryLimits } from '@/storage/history-cleaner'
import { writeMultipleHistory } from '@/storage/history-writer'
import { MAX_IMAGE_COUNT, type LocalImage, type WebImageUrl } from '@/types/generation'
import type { useApiKeyStore } from '@/stores/api-key'
import type { useGenerationParamsStore } from '@/stores/generation-params'

export const useGenerationStore = defineStore('generation', () => {
  const isGenerating = ref(false)
  const currentResults = ref<ParsedImageResult[]>([])
  const error = ref<AppError | null>(null)
  const lastGenerationTime = ref<number | null>(null)
  const storageWarning = ref<AppError | null>(null)
  const completedCount = ref(0)
  const targetCount = ref(0)

  const hasResults = computed(() => currentResults.value.length > 0)
  const loadingMessage = computed(() => {
    if (targetCount.value > 1) {
      const activeCount = Math.min(completedCount.value + 1, targetCount.value)
      return `图片生成中 ${activeCount}/${targetCount.value}`
    }
    return '图片生成中，请稍候...'
  })

  function normalizeTargetCount(value: number): number {
    if (!Number.isInteger(value)) return 1
    return Math.min(Math.max(value, 1), MAX_IMAGE_COUNT)
  }

  function normalizeGenerationError(err: unknown, apiKey: string): AppError {
    const appError = err as AppError
    if (appError && typeof appError === 'object' && 'code' in appError && 'userMessage' in appError) {
      return appError
    }
    return {
      code: 'UNKNOWN_ERROR',
      userMessage: '发生未知错误，请稍后重试',
      debugHint: sanitizeText(String(err), [apiKey]),
    }
  }

  function createPartialFailureError(completed: number, target: number, cause: AppError): AppError {
    return {
      ...cause,
      userMessage: `已生成 ${completed}/${target}，剩余图片生成失败：${cause.userMessage}`,
    }
  }

  function touchLastGenerationTime() {
    const now = Date.now()
    lastGenerationTime.value = lastGenerationTime.value !== null && now <= lastGenerationTime.value
      ? lastGenerationTime.value + 1
      : now
  }

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
    touchLastGenerationTime()
  }

  function setError(err: AppError | null) {
    error.value = err
  }

  function setGenerating(value: boolean) {
    isGenerating.value = value
    if (value) {
      error.value = null
      completedCount.value = 0
      targetCount.value = 0
    }
  }

  function clearAll() {
    _releaseResults(currentResults.value)
    currentResults.value = []
    error.value = null
    lastGenerationTime.value = null
    storageWarning.value = null
    completedCount.value = 0
    targetCount.value = 0
  }

  async function sendSingleImageRequest(
    apiKey: string,
    trimmedPrompt: string,
    paramsStore: ReturnType<typeof useGenerationParamsStore>,
    mode: 'generations' | 'edits-multipart' | 'edits-json',
    fetchFn?: typeof fetch,
  ): Promise<ApiResponse> {
    const commonParams = {
      prompt: trimmedPrompt,
      size: paramsStore.size,
      quality: paramsStore.quality,
      background: paramsStore.background,
      output_format: paramsStore.outputFormat,
      output_compression: paramsStore.compressionEnabled ? paramsStore.outputCompression : null,
    }

    if (mode === 'generations') {
      const params: GenerationsParams = commonParams
      return fetchFn
        ? sendGenerationsRequest(apiKey, params, fetchFn)
        : sendGenerationsRequest(apiKey, params)
    }

    if (mode === 'edits-multipart') {
      const images = paramsStore.localImages.map((img: LocalImage) => img.file)
      const maskFile = paramsStore.maskImage?.file
      const params: EditsMultipartParams = {
        ...commonParams,
        images,
        mask: maskFile,
      }
      return fetchFn
        ? sendEditsMultipartRequest(apiKey, params, fetchFn)
        : sendEditsMultipartRequest(apiKey, params)
    }

    const imageUrls = paramsStore.webImageUrls.map((item: WebImageUrl) => item.url)
    const maskUrl = paramsStore.maskImage?.url
    const params: EditsJsonParams = {
      ...commonParams,
      imageUrls,
      maskUrl,
    }
    return fetchFn
      ? sendEditsJsonRequest(apiKey, params, fetchFn)
      : sendEditsJsonRequest(apiKey, params)
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
    completedCount.value = 0
    targetCount.value = normalizeTargetCount(paramsStore.n)

    try {
      const safePrompt = sanitizeText(trimmedPrompt, [apiKey])
      let startedNewResults = false
      let requestsCompleted = 0

      while (requestsCompleted < targetCount.value) {
        const apiResponse = await sendSingleImageRequest(apiKey, trimmedPrompt, paramsStore, mode, fetchFn)
        requestsCompleted++

        const parsedResults = parseApiResponse(apiResponse, paramsStore.outputFormat)
        const safeResults = parsedResults.map((result) => ({
          ...result,
          revisedPrompt: result.revisedPrompt ? sanitizeText(result.revisedPrompt, [apiKey]) : result.revisedPrompt,
        }))
        if (safeResults.length === 0) {
          throw createValidationError('生成结果为空，请重试')
        }

        if (!startedNewResults) {
          _releaseResults(currentResults.value)
          currentResults.value = []
          startedNewResults = true
        }

        currentResults.value.push(...safeResults)
        completedCount.value = Math.min(targetCount.value, completedCount.value + safeResults.length)

        const writeResult = await writeMultipleHistory(
          safeResults.map((r) => ({
            imageBlob: r.blob,
            revisedPrompt: r.revisedPrompt ?? null,
          })),
          {
            prompt: safePrompt,
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
          if (writeResult.failureCount === safeResults.length) {
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
        touchLastGenerationTime()
      }

      return true
    } catch (err: unknown) {
      const appError = normalizeGenerationError(err, apiKey)
      error.value = completedCount.value > 0
        ? createPartialFailureError(completedCount.value, targetCount.value, appError)
        : appError
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
    completedCount,
    targetCount,
    hasResults,
    loadingMessage,
    clearResults,
    removeResult,
    setResults,
    setError,
    setGenerating,
    clearAll,
    generate,
  }
})
