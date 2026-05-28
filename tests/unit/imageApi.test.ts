import { describe, expect, it, vi } from 'vitest'
import { createImageApiClient, parseImageApiResponse, resolveImageRequestMode } from '@/services/imageApi'
import {
  IMAGE_MODEL,
  IMAGE_RESPONSE_FORMAT,
  type LocalImageInput,
  type NormalizedGenerationParams,
} from '@/types/generation'

const baseParams: NormalizedGenerationParams = {
  model: IMAGE_MODEL,
  response_format: IMAGE_RESPONSE_FORMAT,
  prompt: 'A quiet studio',
  size: '1024x1024',
  n: 1,
  quality: 'auto',
  background: 'auto',
  output_format: 'webp',
  output_compression: 80,
  referenceImages: [],
  imageUrls: [],
  maskImage: null,
  maskImageUrl: '',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function createFetchMock(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(jsonResponse(body, status)) as unknown as typeof fetch
}

function createLocalImage(name: string, type = 'image/png'): LocalImageInput {
  const file = new File(['image-bytes'], name, { type })
  return {
    id: name,
    file,
    name,
    type,
    size: file.size,
  }
}

describe('image API service', () => {
  it('builds text-to-image JSON requests for /v1/images/generations', async () => {
    const fetchFn = createFetchMock({ data: [{ b64_json: 'aW1hZ2U=' }] })
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com/',
      apiKey: 'sk-test',
      fetchFn,
    })

    const results = await client.generateFromText(baseParams)
    const [url, init] = vi.mocked(fetchFn).mock.calls[0]
    const body = JSON.parse(init?.body as string)

    expect(url).toBe('https://sub2api.example.com/v1/images/generations')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer sk-test',
      'Content-Type': 'application/json',
    })
    expect(body).toMatchObject({
      model: 'gpt-image-2',
      response_format: 'b64_json',
      prompt: 'A quiet studio',
      output_compression: 80,
    })
    expect(results).toEqual([{ b64Json: 'aW1hZ2U=' }])
  })

  it('parses multiple b64_json response items with revised prompts', async () => {
    const results = await parseImageApiResponse({
      data: [
        { b64_json: 'Zmlyc3Q=', revised_prompt: 'first revised' },
        { b64_json: 'c2Vjb25k' },
      ],
    })

    expect(results).toEqual([
      { b64Json: 'Zmlyc3Q=', revisedPrompt: 'first revised' },
      { b64Json: 'c2Vjb25k' },
    ])
  })

  it('classifies non-success HTTP responses through the global error rules', async () => {
    const fetchFn = createFetchMock({ error: 'bad key' }, 401)
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com',
      apiKey: 'sk-test',
      fetchFn,
    })

    await expect(client.generateFromText(baseParams)).rejects.toMatchObject({ code: 'auth' })
  })

  it('builds multipart edit requests without setting Content-Type manually', async () => {
    const fetchFn = createFetchMock({ data: [{ b64_json: 'ZWRpdA==' }] })
    const reference = createLocalImage('reference.png')
    const mask = createLocalImage('mask.png')
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com',
      apiKey: 'sk-test',
      fetchFn,
    })

    await client.editWithLocalImages({
      ...baseParams,
      referenceImages: [reference],
      maskImage: mask,
    })

    const [url, init] = vi.mocked(fetchFn).mock.calls[0]
    const headers = init?.headers as Record<string, string>
    const body = init?.body as FormData

    expect(url).toBe('https://sub2api.example.com/v1/images/edits')
    expect(headers.Authorization).toBe('Bearer sk-test')
    expect(headers['Content-Type']).toBeUndefined()
    expect(body.get('model')).toBe('gpt-image-2')
    expect(body.get('prompt')).toBe('A quiet studio')
    expect(body.getAll('image')).toHaveLength(1)
    expect(body.get('mask')).toBeInstanceOf(File)
  })

  it('builds URL edit JSON requests with images array and mask URL', async () => {
    const fetchFn = createFetchMock({ data: [{ b64_json: 'dXJsLWVkaXQ=' }] })
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com',
      apiKey: 'sk-test',
      fetchFn,
    })

    await client.editWithImageUrls({
      ...baseParams,
      imageUrls: ['https://example.com/a.png', 'https://example.com/b.png'],
      maskImageUrl: 'https://example.com/mask.png',
    })

    const [, init] = vi.mocked(fetchFn).mock.calls[0]
    const body = JSON.parse(init?.body as string)

    expect(body).toMatchObject({
      model: 'gpt-image-2',
      response_format: 'b64_json',
      images: [{ image_url: 'https://example.com/a.png' }, { image_url: 'https://example.com/b.png' }],
      mask: { image_url: 'https://example.com/mask.png' },
    })
  })

  it('selects the correct request mode and rejects mixed local plus URL inputs', () => {
    expect(resolveImageRequestMode(baseParams)).toBe('generation')
    expect(resolveImageRequestMode({ ...baseParams, referenceImages: [createLocalImage('reference.png')] })).toBe(
      'multipart_edit',
    )
    expect(resolveImageRequestMode({ ...baseParams, imageUrls: ['https://example.com/a.png'] })).toBe('url_edit')

    expect(() =>
      resolveImageRequestMode({
        ...baseParams,
        referenceImages: [createLocalImage('reference.png')],
        imageUrls: ['https://example.com/a.png'],
      }),
    ).toThrow()
  })

  it('submit rejects invalid URL params before fetch is called', async () => {
    const fetchFn = createFetchMock({ data: [{ b64_json: 'dXJsLWVkaXQ=' }] })
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com',
      apiKey: 'sk-test',
      fetchFn,
    })

    await expect(
      client.submit({
        ...baseParams,
        imageUrls: ['ftp://example.com/a.png'],
      }),
    ).rejects.toMatchObject({ code: 'validation' })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('maps fetch exceptions to safe network or CORS errors', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch
    const client = createImageApiClient({
      baseUrl: 'https://sub2api.example.com',
      apiKey: 'sk-test',
      fetchFn,
    })

    await expect(client.generateFromText(baseParams)).rejects.toMatchObject({ code: 'cors' })
  })
})
