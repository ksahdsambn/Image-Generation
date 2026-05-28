import {
  classifyFetchException,
  classifyHttpError,
  createAppError,
  type AppError,
} from '@/errors/appError'
import { validateGenerationParams, type NormalizedGenerationParams } from '@/types/generation'

export type ImageApiResult = {
  b64Json: string
  revisedPrompt?: string
}

export type ImageApiClientOptions = {
  baseUrl: string
  apiKey: string
  fetchFn?: typeof fetch
}

export type ImageRequestMode = 'generation' | 'multipart_edit' | 'url_edit'

type RawImageApiResponse = {
  data?: Array<{
    b64_json?: unknown
    revised_prompt?: unknown
  }>
}

type JsonBody = Record<string, unknown>

const GENERATIONS_PATH = '/v1/images/generations'
const EDITS_PATH = '/v1/images/edits'

export function resolveImageRequestMode(params: NormalizedGenerationParams): ImageRequestMode {
  if (params.referenceImages.length > 0 && params.imageUrls.length > 0) {
    throw createAppError('validation')
  }

  if (params.referenceImages.length > 0) {
    return 'multipart_edit'
  }

  if (params.imageUrls.length > 0) {
    return 'url_edit'
  }

  return 'generation'
}

export function createImageApiClient(options: ImageApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, '')
  const fetchFn = options.fetchFn ?? fetch

  async function submit(params: NormalizedGenerationParams): Promise<ImageApiResult[]> {
    assertUsableOptions(options)
    const validation = validateGenerationParams({
      prompt: params.prompt,
      size: params.size,
      count: params.n,
      quality: params.quality,
      background: params.background,
      outputFormat: params.output_format,
      outputCompression: params.output_compression ?? null,
      referenceImages: params.referenceImages,
      imageUrls: params.imageUrls,
      maskImage: params.maskImage,
      maskImageUrl: params.maskImageUrl,
    })

    if (!validation.ok) {
      throw createAppError('validation')
    }

    const mode = resolveImageRequestMode(params)

    if (mode === 'multipart_edit') {
      return editWithLocalImages(params)
    }

    if (mode === 'url_edit') {
      return editWithImageUrls(params)
    }

    return generateFromText(params)
  }

  async function generateFromText(params: NormalizedGenerationParams): Promise<ImageApiResult[]> {
    assertUsableOptions(options)
    const response = await safeFetch(`${baseUrl}${GENERATIONS_PATH}`, {
      method: 'POST',
      headers: createJsonHeaders(options.apiKey),
      body: JSON.stringify(createBaseJsonBody(params)),
    })

    return parseJsonResponse(response)
  }

  async function editWithLocalImages(params: NormalizedGenerationParams): Promise<ImageApiResult[]> {
    assertUsableOptions(options)
    if (params.referenceImages.length === 0) {
      throw createAppError('validation')
    }

    const formData = new FormData()
    appendCommonFormFields(formData, params)
    params.referenceImages.forEach((image) => {
      formData.append('image', image.file, image.name)
    })

    if (params.maskImage) {
      formData.append('mask', params.maskImage.file, params.maskImage.name)
    }

    const response = await safeFetch(`${baseUrl}${EDITS_PATH}`, {
      method: 'POST',
      headers: createAuthHeaders(options.apiKey),
      body: formData,
    })

    return parseJsonResponse(response)
  }

  async function editWithImageUrls(params: NormalizedGenerationParams): Promise<ImageApiResult[]> {
    assertUsableOptions(options)
    if (params.imageUrls.length === 0) {
      throw createAppError('validation')
    }

    const body = {
      ...createBaseJsonBody(params),
      images: params.imageUrls.map((imageUrl) => ({ image_url: imageUrl })),
      ...(params.maskImageUrl ? { mask: { image_url: params.maskImageUrl } } : {}),
    }

    const response = await safeFetch(`${baseUrl}${EDITS_PATH}`, {
      method: 'POST',
      headers: createJsonHeaders(options.apiKey),
      body: JSON.stringify(body),
    })

    return parseJsonResponse(response)
  }

  async function safeFetch(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    try {
      return await fetchFn(input, init)
    } catch (error) {
      throw classifyFetchException(error)
    }
  }

  return {
    submit,
    generateFromText,
    editWithLocalImages,
    editWithImageUrls,
  }
}

export async function parseImageApiResponse(body: unknown): Promise<ImageApiResult[]> {
  const response = body as RawImageApiResponse
  const data = response?.data

  if (!Array.isArray(data) || data.length === 0) {
    throw createAppError('upstream')
  }

  const results = data.map((item) => {
    if (typeof item.b64_json !== 'string' || item.b64_json.length === 0) {
      throw createAppError('upstream')
    }

    return {
      b64Json: item.b64_json,
      ...(typeof item.revised_prompt === 'string' ? { revisedPrompt: item.revised_prompt } : {}),
    }
  })

  return results
}

function createBaseJsonBody(params: NormalizedGenerationParams): JsonBody {
  return {
    model: params.model,
    prompt: params.prompt,
    size: params.size,
    n: params.n,
    quality: params.quality,
    background: params.background,
    output_format: params.output_format,
    response_format: params.response_format,
    ...(params.output_compression === undefined ? {} : { output_compression: params.output_compression }),
  }
}

function appendCommonFormFields(formData: FormData, params: NormalizedGenerationParams) {
  Object.entries(createBaseJsonBody(params)).forEach(([key, value]) => {
    formData.append(key, String(value))
  })
}

function createAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

function createJsonHeaders(apiKey: string): HeadersInit {
  return {
    ...createAuthHeaders(apiKey),
    'Content-Type': 'application/json',
  }
}

async function parseJsonResponse(response: Response): Promise<ImageApiResult[]> {
  const body = await parseResponseBody(response)

  if (!response.ok) {
    throw classifyHttpError({ status: response.status, body })
  }

  return parseImageApiResponse(body)
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function assertUsableOptions(options: ImageApiClientOptions) {
  if (!options.baseUrl || !options.apiKey.trim()) {
    throw createAppError('validation')
  }
}

export function isAppError(error: unknown): error is AppError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      'retryable' in error,
  )
}
