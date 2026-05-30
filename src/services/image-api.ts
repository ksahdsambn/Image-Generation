import { loadConfig } from '@/utils/config'
import { classifyHttpError, classifyNetworkError, createConfigError, createValidationError, type AppError } from '@/types/errors'
import { MODEL, RESPONSE_FORMAT, type LocalImage, type WebImageUrl } from '@/types/generation'
import type { ApiResponse, RequestMode } from '@/types/api'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export function decideRequestMode(localImages: LocalImage[], webImageUrls: WebImageUrl[]): RequestMode {
  const hasLocal = localImages.length > 0
  const hasWeb = webImageUrls.length > 0
  if (hasLocal && hasWeb) return 'conflict'
  if (hasLocal) return 'edits-multipart'
  if (hasWeb) return 'edits-json'
  return 'generations'
}

export interface GenerationsParams {
  prompt: string
  size?: string
  n?: number
  quality?: string
  background?: string
  output_format?: string
  output_compression?: number | null
}

export function buildGenerationsBody(params: GenerationsParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt: params.prompt.trim(),
    response_format: RESPONSE_FORMAT,
  }
  if (params.size) body.size = params.size
  if (params.n != null && params.n > 1) body.n = params.n
  if (params.quality) body.quality = params.quality
  if (params.background) body.background = params.background
  if (params.output_format) body.output_format = params.output_format
  if (params.output_compression != null) body.output_compression = params.output_compression
  return body
}

export async function sendGenerationsRequest(
  apiKey: string,
  params: GenerationsParams,
  fetchFn: typeof fetch = fetch,
): Promise<ApiResponse> {
  const config = loadConfig()
  if (config.configError) throw createConfigError(config.configError)
  if (!apiKey.trim()) throw createValidationError('缺少 API Key')

  const url = `${config.sub2apiBaseUrl}/v1/images/generations`
  const body = buildGenerationsBody(params)

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw classifyHttpError(response.status, errorBody)
    }

    return await response.json() as ApiResponse
  } catch (error: unknown) {
    if (isAppError(error)) throw error
    if (error instanceof TypeError || error instanceof Error) {
      throw classifyNetworkError(error)
    }
    throw classifyNetworkError(new Error(String(error)))
  }
}

export function validateImageFile(file: File): AppError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return createValidationError('不支持的文件类型，仅支持 PNG、JPEG、WebP、GIF 图片')
  }
  if (file.size > MAX_FILE_SIZE) {
    return createValidationError(`文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`)
  }
  return null
}

export interface EditsMultipartParams {
  prompt: string
  images: File[]
  mask?: File
  size?: string
  quality?: string
  background?: string
  output_format?: string
  output_compression?: number | null
  n?: number
}

export function buildEditsMultipartBody(params: EditsMultipartParams): FormData {
  const formData = new FormData()
  formData.append('model', MODEL)
  formData.append('prompt', params.prompt.trim())
  formData.append('response_format', RESPONSE_FORMAT)

  for (const image of params.images) {
    formData.append('image', image)
  }

  if (params.mask) {
    formData.append('mask', params.mask)
  }

  if (params.size) formData.append('size', params.size)
  if (params.quality) formData.append('quality', params.quality)
  if (params.background) formData.append('background', params.background)
  if (params.output_format) formData.append('output_format', params.output_format)
  if (params.output_compression != null) formData.append('output_compression', String(params.output_compression))
  if (params.n != null && params.n > 1) formData.append('n', String(params.n))

  return formData
}

export async function sendEditsMultipartRequest(
  apiKey: string,
  params: EditsMultipartParams,
  fetchFn: typeof fetch = fetch,
): Promise<ApiResponse> {
  const config = loadConfig()
  if (config.configError) throw createConfigError(config.configError)
  if (!apiKey.trim()) throw createValidationError('缺少 API Key')
  if (params.images.length === 0) throw createValidationError('缺少参考图')

  for (const image of params.images) {
    const fileError = validateImageFile(image)
    if (fileError) throw fileError
  }
  if (params.mask) {
    const maskError = validateImageFile(params.mask)
    if (maskError) throw maskError
  }

  const url = `${config.sub2apiBaseUrl}/v1/images/edits`
  const formData = buildEditsMultipartBody(params)

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw classifyHttpError(response.status, errorBody)
    }

    return await response.json() as ApiResponse
  } catch (error: unknown) {
    if (isAppError(error)) throw error
    if (error instanceof TypeError || error instanceof Error) {
      throw classifyNetworkError(error)
    }
    throw classifyNetworkError(new Error(String(error)))
  }
}

export interface EditsJsonParams {
  prompt: string
  imageUrls: string[]
  maskUrl?: string
  size?: string
  quality?: string
  background?: string
  output_format?: string
  output_compression?: number | null
  n?: number
}

export function validateImageUrl(url: string): AppError | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return createValidationError('图片 URL 必须使用 http 或 https 协议')
    }
    return null
  } catch {
    return createValidationError('图片 URL 格式无效')
  }
}

export function buildEditsJsonBody(params: EditsJsonParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt: params.prompt.trim(),
    response_format: RESPONSE_FORMAT,
    images: params.imageUrls.map(url => ({ image_url: url })),
  }

  if (params.maskUrl) {
    body.mask = { image_url: params.maskUrl }
  }

  if (params.size) body.size = params.size
  if (params.quality) body.quality = params.quality
  if (params.background) body.background = params.background
  if (params.output_format) body.output_format = params.output_format
  if (params.output_compression != null) body.output_compression = params.output_compression
  if (params.n != null && params.n > 1) body.n = params.n

  return body
}

export async function sendEditsJsonRequest(
  apiKey: string,
  params: EditsJsonParams,
  fetchFn: typeof fetch = fetch,
): Promise<ApiResponse> {
  const config = loadConfig()
  if (config.configError) throw createConfigError(config.configError)
  if (!apiKey.trim()) throw createValidationError('缺少 API Key')
  if (params.imageUrls.length === 0) throw createValidationError('缺少图片 URL')

  for (const url of params.imageUrls) {
    const urlError = validateImageUrl(url)
    if (urlError) throw urlError
  }
  if (params.maskUrl) {
    const maskUrlError = validateImageUrl(params.maskUrl)
    if (maskUrlError) throw maskUrlError
  }

  const url = `${config.sub2apiBaseUrl}/v1/images/edits`
  const body = buildEditsJsonBody(params)

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw classifyHttpError(response.status, errorBody)
    }

    return await response.json() as ApiResponse
  } catch (error: unknown) {
    if (isAppError(error)) throw error
    if (error instanceof TypeError || error instanceof Error) {
      throw classifyNetworkError(error)
    }
    throw classifyNetworkError(new Error(String(error)))
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'debugHint' in error
  )
}
