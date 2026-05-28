import { defineStore } from 'pinia'
import {
  createDefaultGenerationParams,
  createLocalImageInput,
  DEFAULT_OUTPUT_COMPRESSION,
  isSupportedBackground,
  isSupportedImageQuality,
  isSupportedImageSize,
  isSupportedOutputFormat,
  MAX_IMAGE_FILE_BYTES,
  normalizeCompression,
  normalizeImageCount,
  supportsOutputCompression,
  validateGenerationParams,
  type GenerationParamsState,
  type ImageBackground,
  type ImageOutputFormat,
  type ImageQuality,
  type ImageSize,
} from '@/types/generation'

export const useGenerationParamsStore = defineStore('generationParams', {
  state: (): GenerationParamsState => createDefaultGenerationParams(),
  getters: {
    trimmedPrompt: (state) => state.prompt.trim(),
    validation: (state) => validateGenerationParams(state),
    canSubmit(): boolean {
      return this.validation.ok
    },
    normalizedParams() {
      return this.validation.ok ? this.validation.params : null
    },
  },
  actions: {
    setPrompt(value: string) {
      this.prompt = value
    },
    setSize(value: string) {
      if (isSupportedImageSize(value)) {
        this.size = value
      }
    },
    setCount(value: number) {
      this.count = normalizeImageCount(value)
    },
    setQuality(value: string) {
      if (isSupportedImageQuality(value)) {
        this.quality = value
      }
    },
    setBackground(value: string) {
      if (isSupportedBackground(value)) {
        this.background = value
      }
    },
    setOutputFormat(value: string) {
      if (!isSupportedOutputFormat(value)) {
        return
      }

      this.outputFormat = value
      this.outputCompression = supportsOutputCompression(value) ? DEFAULT_OUTPUT_COMPRESSION : null
    },
    setOutputCompression(value: number) {
      if (!supportsOutputCompression(this.outputFormat)) {
        this.outputCompression = null
        return
      }

      this.outputCompression = normalizeCompression(value)
    },
    addReferenceImage(file: File): boolean {
      if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_FILE_BYTES) {
        return false
      }

      this.referenceImages.push(createLocalImageInput(file))
      return true
    },
    removeReferenceImage(id: string) {
      this.referenceImages = this.referenceImages.filter((image) => image.id !== id)
    },
    addImageUrl(value: string) {
      const url = value.trim()
      if (url && !this.imageUrls.includes(url)) {
        this.imageUrls.push(url)
      }
    },
    removeImageUrl(value: string) {
      this.imageUrls = this.imageUrls.filter((url) => url !== value)
    },
    setMaskImage(file: File | null): boolean {
      if (!file) {
        this.maskImage = null
        return true
      }

      if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_FILE_BYTES) {
        return false
      }

      this.maskImage = createLocalImageInput(file)
      return true
    },
    setMaskImageUrl(value: string) {
      this.maskImageUrl = value
    },
    resetParams() {
      this.$patch(createDefaultGenerationParams())
    },
    setTypedSize(value: ImageSize) {
      this.size = value
    },
    setTypedQuality(value: ImageQuality) {
      this.quality = value
    },
    setTypedBackground(value: ImageBackground) {
      this.background = value
    },
    setTypedOutputFormat(value: ImageOutputFormat) {
      this.setOutputFormat(value)
    },
  },
})
