import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type ImageSize,
  type ImageQuality,
  type ImageBackground,
  type OutputFormat,
  type LocalImage,
  type WebImageUrl,
  type MaskImage,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_QUALITY,
  DEFAULT_BACKGROUND,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_IMAGE_COUNT,
  MODEL,
  RESPONSE_FORMAT,
  isValidSize,
  isValidCount,
  isValidQuality,
  isValidBackground,
  isValidOutputFormat,
  isCompressionApplicable,
  validatePrompt,
} from '@/types/generation'

export const useGenerationParamsStore = defineStore('generationParams', () => {
  const prompt = ref('')
  const size = ref<ImageSize>(DEFAULT_IMAGE_SIZE)
  const n = ref(DEFAULT_IMAGE_COUNT)
  const quality = ref<ImageQuality>(DEFAULT_QUALITY)
  const background = ref<ImageBackground>(DEFAULT_BACKGROUND)
  const outputFormat = ref<OutputFormat>(DEFAULT_OUTPUT_FORMAT)
  const outputCompression = ref<number | null>(null)
  const localImages = ref<LocalImage[]>([])
  const webImageUrls = ref<WebImageUrl[]>([])
  const maskImage = ref<MaskImage | null>(null)

  const promptError = computed(() => validatePrompt(prompt.value))

  const compressionEnabled = computed(() => isCompressionApplicable(outputFormat.value))

  const hasReferenceImages = computed(() => localImages.value.length > 0 || webImageUrls.value.length > 0)

  const hasLocalImages = computed(() => localImages.value.length > 0)

  const hasWebImageUrls = computed(() => webImageUrls.value.length > 0)

  const hasMixedRefSources = computed(() => localImages.value.length > 0 && webImageUrls.value.length > 0)

  const canSubmit = computed(() => {
    if (validatePrompt(prompt.value) !== null) return false
    if (localImages.value.length > 0 && webImageUrls.value.length > 0) return false
    return true
  })

  function setSize(value: string) {
    if (isValidSize(value)) {
      size.value = value
    }
  }

  function setCount(value: number) {
    if (isValidCount(value)) {
      n.value = value
    }
  }

  function setQuality(value: string) {
    if (isValidQuality(value)) {
      quality.value = value
    }
  }

  function setBackground(value: string) {
    if (isValidBackground(value)) {
      background.value = value
    }
  }

  function setOutputFormat(value: string) {
    if (isValidOutputFormat(value)) {
      outputFormat.value = value
      if (!isCompressionApplicable(value)) {
        outputCompression.value = null
      } else if (outputCompression.value === null) {
        outputCompression.value = 80
      }
    }
  }

  function setOutputCompression(value: number | null) {
    if (value === null || (Number.isFinite(value) && value >= 0 && value <= 100)) {
      outputCompression.value = value
    }
  }

  function addLocalImage(image: LocalImage) {
    localImages.value.push(image)
  }

  function removeLocalImage(index: number) {
    if (index >= 0 && index < localImages.value.length) {
      localImages.value.splice(index, 1)
    }
  }

  function clearLocalImages() {
    localImages.value = []
  }

  function addWebImageUrl(url: string) {
    webImageUrls.value.push({ url })
  }

  function removeWebImageUrl(index: number) {
    if (index >= 0 && index < webImageUrls.value.length) {
      webImageUrls.value.splice(index, 1)
    }
  }

  function clearWebImageUrls() {
    webImageUrls.value = []
  }

  function setMaskImage(mask: MaskImage | null) {
    maskImage.value = mask
  }

  function buildRequestBody() {
    const trimmedPrompt = prompt.value.trim()
    if (!trimmedPrompt) return null

    const body: Record<string, unknown> = {
      model: MODEL,
      prompt: trimmedPrompt,
      size: size.value,
      n: n.value,
      quality: quality.value,
      background: background.value,
      output_format: outputFormat.value,
      response_format: RESPONSE_FORMAT,
    }

    if (isCompressionApplicable(outputFormat.value) && outputCompression.value !== null) {
      body.output_compression = outputCompression.value
    }

    return body
  }

  function resetParams() {
    prompt.value = ''
    size.value = DEFAULT_IMAGE_SIZE
    n.value = DEFAULT_IMAGE_COUNT
    quality.value = DEFAULT_QUALITY
    background.value = DEFAULT_BACKGROUND
    outputFormat.value = DEFAULT_OUTPUT_FORMAT
    outputCompression.value = 80
    localImages.value = []
    webImageUrls.value = []
    maskImage.value = null
  }

  return {
    prompt,
    size,
    n,
    quality,
    background,
    outputFormat,
    outputCompression,
    localImages,
    webImageUrls,
    maskImage,
    promptError,
    compressionEnabled,
    hasReferenceImages,
    hasLocalImages,
    hasWebImageUrls,
    hasMixedRefSources,
    canSubmit,
    setSize,
    setCount,
    setQuality,
    setBackground,
    setOutputFormat,
    setOutputCompression,
    addLocalImage,
    removeLocalImage,
    clearLocalImages,
    addWebImageUrl,
    removeWebImageUrl,
    clearWebImageUrls,
    setMaskImage,
    buildRequestBody,
    resetParams,
  }
})
