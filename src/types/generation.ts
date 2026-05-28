export const IMAGE_MODEL = 'gpt-image-2' as const
export const IMAGE_RESPONSE_FORMAT = 'b64_json' as const

export const SUPPORTED_IMAGE_SIZES = ['1024x1024', '1536x1024', '1024x1536', 'auto'] as const
export const SUPPORTED_IMAGE_QUALITIES = ['auto', 'low', 'medium', 'high'] as const
export const SUPPORTED_BACKGROUNDS = ['auto', 'opaque', 'transparent'] as const
export const SUPPORTED_OUTPUT_FORMATS = ['webp', 'png', 'jpeg'] as const

export const MIN_IMAGE_COUNT = 1
export const MAX_IMAGE_COUNT = 4
export const DEFAULT_OUTPUT_COMPRESSION = 80
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024

export type ImageModel = typeof IMAGE_MODEL
export type ImageResponseFormat = typeof IMAGE_RESPONSE_FORMAT
export type ImageSize = (typeof SUPPORTED_IMAGE_SIZES)[number]
export type ImageQuality = (typeof SUPPORTED_IMAGE_QUALITIES)[number]
export type ImageBackground = (typeof SUPPORTED_BACKGROUNDS)[number]
export type ImageOutputFormat = (typeof SUPPORTED_OUTPUT_FORMATS)[number]

export type LocalImageInput = {
  id: string
  file: File
  name: string
  type: string
  size: number
}

export type GenerationParamsState = {
  prompt: string
  size: ImageSize
  count: number
  quality: ImageQuality
  background: ImageBackground
  outputFormat: ImageOutputFormat
  outputCompression: number | null
  referenceImages: LocalImageInput[]
  imageUrls: string[]
  maskImage: LocalImageInput | null
  maskImageUrl: string
}

export type NormalizedGenerationParams = {
  model: ImageModel
  response_format: ImageResponseFormat
  prompt: string
  size: ImageSize
  n: number
  quality: ImageQuality
  background: ImageBackground
  output_format: ImageOutputFormat
  output_compression?: number
  referenceImages: LocalImageInput[]
  imageUrls: string[]
  maskImage: LocalImageInput | null
  maskImageUrl: string
}

export type GenerationValidationResult =
  | {
      ok: true
      params: NormalizedGenerationParams
      errors: []
    }
  | {
      ok: false
      params: null
      errors: string[]
    }

export function createDefaultGenerationParams(): GenerationParamsState {
  return {
    prompt: '',
    size: '1024x1024',
    count: 1,
    quality: 'auto',
    background: 'auto',
    outputFormat: 'webp',
    outputCompression: DEFAULT_OUTPUT_COMPRESSION,
    referenceImages: [],
    imageUrls: [],
    maskImage: null,
    maskImageUrl: '',
  }
}

export function supportsOutputCompression(format: ImageOutputFormat): boolean {
  return format === 'webp' || format === 'jpeg'
}

export function isSupportedImageSize(value: string): value is ImageSize {
  return SUPPORTED_IMAGE_SIZES.includes(value as ImageSize)
}

export function isSupportedImageQuality(value: string): value is ImageQuality {
  return SUPPORTED_IMAGE_QUALITIES.includes(value as ImageQuality)
}

export function isSupportedBackground(value: string): value is ImageBackground {
  return SUPPORTED_BACKGROUNDS.includes(value as ImageBackground)
}

export function isSupportedOutputFormat(value: string): value is ImageOutputFormat {
  return SUPPORTED_OUTPUT_FORMATS.includes(value as ImageOutputFormat)
}

export function normalizeImageCount(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_IMAGE_COUNT
  }

  return Math.min(MAX_IMAGE_COUNT, Math.max(MIN_IMAGE_COUNT, Math.trunc(value)))
}

export function normalizeCompression(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OUTPUT_COMPRESSION
  }

  return Math.min(100, Math.max(0, Math.trunc(value)))
}

export function isValidHttpImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function createLocalImageInput(file: File): LocalImageInput {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    name: file.name,
    type: file.type,
    size: file.size,
  }
}

export function validateGenerationParams(state: GenerationParamsState): GenerationValidationResult {
  const errors: string[] = []
  const prompt = state.prompt.trim()
  const imageUrls = state.imageUrls.map((url) => url.trim()).filter(Boolean)
  const maskImageUrl = state.maskImageUrl.trim()

  if (!prompt) {
    errors.push('Prompt is required.')
  }

  if (!isSupportedImageSize(state.size)) {
    errors.push('Image size is not supported.')
  }

  if (state.count < MIN_IMAGE_COUNT || state.count > MAX_IMAGE_COUNT) {
    errors.push(`Image count must be between ${MIN_IMAGE_COUNT} and ${MAX_IMAGE_COUNT}.`)
  }

  for (const image of state.referenceImages) {
    if (!image.type.startsWith('image/')) {
      errors.push('Reference images must be image files.')
      break
    }

    if (image.size > MAX_IMAGE_FILE_BYTES) {
      errors.push('Reference image is too large.')
      break
    }
  }

  if (state.maskImage && !state.maskImage.type.startsWith('image/')) {
    errors.push('Mask must be an image file.')
  }

  if (state.maskImage && state.maskImage.size > MAX_IMAGE_FILE_BYTES) {
    errors.push('Mask image is too large.')
  }

  if (imageUrls.some((url) => !isValidHttpImageUrl(url))) {
    errors.push('Image URLs must start with http or https.')
  }

  if (maskImageUrl && !isValidHttpImageUrl(maskImageUrl)) {
    errors.push('Mask URL must start with http or https.')
  }

  if (state.referenceImages.length > 0 && imageUrls.length > 0) {
    errors.push('Use either local reference images or image URLs, not both.')
  }

  if (state.maskImage && maskImageUrl) {
    errors.push('Use either a local mask image or a mask URL, not both.')
  }

  if (errors.length > 0) {
    return {
      ok: false,
      params: null,
      errors,
    }
  }

  const outputCompression = supportsOutputCompression(state.outputFormat)
    ? normalizeCompression(state.outputCompression ?? DEFAULT_OUTPUT_COMPRESSION)
    : undefined

  return {
    ok: true,
    params: {
      model: IMAGE_MODEL,
      response_format: IMAGE_RESPONSE_FORMAT,
      prompt,
      size: state.size,
      n: normalizeImageCount(state.count),
      quality: state.quality,
      background: state.background,
      output_format: state.outputFormat,
      ...(outputCompression === undefined ? {} : { output_compression: outputCompression }),
      referenceImages: state.referenceImages,
      imageUrls,
      maskImage: state.maskImage,
      maskImageUrl,
    },
    errors: [],
  }
}
