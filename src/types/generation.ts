export const IMAGE_SIZES = [
  '1024x1024',
  '1536x1024',
  '1024x1536',
] as const

export type ImageSize = (typeof IMAGE_SIZES)[number]

export const IMAGE_QUALITIES = ['auto', 'high', 'low'] as const
export type ImageQuality = (typeof IMAGE_QUALITIES)[number]

export const IMAGE_BACKGROUNDS = ['auto', 'transparent', 'opaque'] as const
export type ImageBackground = (typeof IMAGE_BACKGROUNDS)[number]

export const OUTPUT_FORMATS = ['png', 'webp', 'jpeg'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

export const MODEL = 'gpt-image-2'
export const RESPONSE_FORMAT = 'b64_json'
export const MIN_IMAGE_COUNT = 1
export const MAX_IMAGE_COUNT = 10

export const DEFAULT_IMAGE_SIZE: ImageSize = '1024x1024'
export const DEFAULT_QUALITY: ImageQuality = 'auto'
export const DEFAULT_BACKGROUND: ImageBackground = 'auto'
export const DEFAULT_OUTPUT_FORMAT: OutputFormat = 'png'
export const DEFAULT_IMAGE_COUNT = 1

export interface LocalImage {
  file: File
  previewUrl: string
}

export interface WebImageUrl {
  url: string
}

export interface MaskImage {
  file?: File
  previewUrl?: string
  url?: string
}

export interface GenerationParams {
  prompt: string
  size: ImageSize
  n: number
  quality: ImageQuality
  background: ImageBackground
  outputFormat: OutputFormat
  outputCompression: number | null
  localImages: LocalImage[]
  webImageUrls: WebImageUrl[]
  maskImage: MaskImage | null
}

export const COMPRESSION_FORMATS: OutputFormat[] = ['webp', 'jpeg']

export function isValidSize(value: string): value is ImageSize {
  return (IMAGE_SIZES as readonly string[]).includes(value)
}

export function isValidQuality(value: string): value is ImageQuality {
  return (IMAGE_QUALITIES as readonly string[]).includes(value)
}

export function isValidBackground(value: string): value is ImageBackground {
  return (IMAGE_BACKGROUNDS as readonly string[]).includes(value)
}

export function isValidOutputFormat(value: string): value is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value)
}

export function isValidCount(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_IMAGE_COUNT && n <= MAX_IMAGE_COUNT
}

export function isCompressionApplicable(format: OutputFormat): boolean {
  return (COMPRESSION_FORMATS as readonly string[]).includes(format)
}

export function validatePrompt(prompt: string): string | null {
  const trimmed = prompt.trim()
  if (trimmed.length === 0) return 'Prompt 不能为空'
  return null
}
