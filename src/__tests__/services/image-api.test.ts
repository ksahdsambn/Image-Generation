import { describe, it, expect, vi } from 'vitest'

vi.mock('@/utils/config', () => ({
  loadConfig: vi.fn(() => ({
    sub2apiBaseUrl: 'https://api.example.com',
    appTitle: 'Test',
    historyMaxItems: 50,
    historyMaxBytes: 524288000,
    rememberKeyEnabled: true,
    configError: null,
  })),
}))

import {
  decideRequestMode,
  buildGenerationsBody,
  sendGenerationsRequest,
  buildEditsMultipartBody,
  sendEditsMultipartRequest,
  buildEditsJsonBody,
  sendEditsJsonRequest,
  validateImageFile,
  validateImageUrl,
} from '@/services/image-api'

function createMockFetch(response: { ok: boolean; status: number; json?: unknown; text?: string }): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: () => Promise.resolve(response.json),
    text: () => Promise.resolve(response.text ?? ''),
  }) as unknown as typeof fetch
}

function createMockFetchNetworkError(error: Error): typeof fetch {
  return vi.fn().mockRejectedValue(error) as unknown as typeof fetch
}

function createPngFile(name = 'test.png', size = 1024): File {
  const file = new File(['x'.repeat(size)], name, { type: 'image/png' })
  return file
}

describe('decideRequestMode', () => {
  it('returns generations when no images', () => {
    expect(decideRequestMode([], [])).toBe('generations')
  })

  it('returns edits-multipart when local images exist', () => {
    expect(decideRequestMode([{ file: createPngFile(), previewUrl: '' }], [])).toBe('edits-multipart')
  })

  it('returns edits-json when web URLs exist', () => {
    expect(decideRequestMode([], [{ url: 'https://example.com/img.png' }])).toBe('edits-json')
  })

  it('returns conflict when both exist', () => {
    expect(decideRequestMode(
      [{ file: createPngFile(), previewUrl: '' }],
      [{ url: 'https://example.com/img.png' }],
    )).toBe('conflict')
  })
})

describe('buildGenerationsBody', () => {
  it('includes model gpt-image-2', () => {
    const body = buildGenerationsBody({ prompt: 'a cat' })
    expect(body.model).toBe('gpt-image-2')
  })

  it('includes response_format b64_json', () => {
    const body = buildGenerationsBody({ prompt: 'a cat' })
    expect(body.response_format).toBe('b64_json')
  })

  it('includes trimmed prompt', () => {
    const body = buildGenerationsBody({ prompt: '  a cat  ' })
    expect(body.prompt).toBe('a cat')
  })

  it('includes size when provided', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', size: '1024x1024' })
    expect(body.size).toBe('1024x1024')
  })

  it('includes n when > 1', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', n: 3 })
    expect(body.n).toBe(3)
  })

  it('omits n when 1', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', n: 1 })
    expect(body.n).toBeUndefined()
  })

  it('includes quality when provided', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', quality: 'high' })
    expect(body.quality).toBe('high')
  })

  it('includes background when provided', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', background: 'transparent' })
    expect(body.background).toBe('transparent')
  })

  it('includes output_format when provided', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', output_format: 'webp' })
    expect(body.output_format).toBe('webp')
  })

  it('includes output_compression when not null', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', output_compression: 80 })
    expect(body.output_compression).toBe(80)
  })

  it('omits output_compression when null', () => {
    const body = buildGenerationsBody({ prompt: 'a cat', output_compression: null })
    expect(body.output_compression).toBeUndefined()
  })

  it('does not allow other model names', () => {
    const body = buildGenerationsBody({ prompt: 'test' } as any)
    expect(body.model).toBe('gpt-image-2')
    expect((body as any).model).not.toBe('dall-e-3')
  })
})

describe('sendGenerationsRequest', () => {

  it('sends request to correct URL', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendGenerationsRequest('sk-test-key', { prompt: 'a cat' }, mockFetch)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.example.com/v1/images/generations')
  })

  it('sends correct Authorization header', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendGenerationsRequest('sk-test-key-12345', { prompt: 'a cat' }, mockFetch)

    const [, options] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer sk-test-key-12345')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('sends JSON body with POST method', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch)

    const [, options] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.model).toBe('gpt-image-2')
    expect(body.prompt).toBe('a cat')
    expect(body.response_format).toBe('b64_json')
  })

  it('parses multi-image response', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: {
        data: [
          { b64_json: 'img1', revised_prompt: 'a cute cat' },
          { b64_json: 'img2' },
        ],
      },
    })

    const result = await sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].b64_json).toBe('img1')
    expect(result.data[0].revised_prompt).toBe('a cute cat')
    expect(result.data[1].b64_json).toBe('img2')
  })

  it('rejects HTTP 200 response when body contains error', async () => {
    const apiKey = 'sub2api-key-with-hyphen-123'
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: {
        error: { message: `Invalid key ${apiKey}`, code: 'invalid_api_key' },
        data: [{ b64_json: 'should-not-be-used' }],
      },
    })

    await expect(
      sendGenerationsRequest(apiKey, { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      debugHint: expect.not.stringContaining(apiKey),
    })
  })

  it('throws config error when base URL is missing', async () => {
    const { loadConfig } = await import('@/utils/config')
    vi.mocked(loadConfig).mockReturnValueOnce({
      sub2apiBaseUrl: '',
      appTitle: 'Test',
      historyMaxItems: 50,
      historyMaxBytes: 524288000,
      rememberKeyEnabled: true,
      configError: '缺少 Sub2API 后端地址配置',
    })

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }),
    ).rejects.toMatchObject({ code: 'CONFIG_ERROR' })
  })

  it('throws validation error when API key is empty', async () => {
    await expect(
      sendGenerationsRequest('', { prompt: 'a cat' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('classifies HTTP error responses', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 401,
      text: 'Unauthorized',
    })

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'AUTH_FAILED' })
  })

  it('classifies network errors', async () => {
    const mockFetch = createMockFetchNetworkError(new TypeError('Failed to fetch'))

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('classifies CORS errors', async () => {
    const mockFetch = createMockFetchNetworkError(new TypeError('Failed to fetch cors'))

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'CORS_BLOCKED' })
  })

  it('handles 403 permission error', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 403,
      text: 'Image permission denied',
    })

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  it('handles 429 rate limit', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 429,
      text: 'Too many requests',
    })

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })

  it('handles 500 upstream error', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 500,
      text: 'Internal server error',
    })

    await expect(
      sendGenerationsRequest('sk-test', { prompt: 'a cat' }, mockFetch),
    ).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' })
  })
})

describe('validateImageFile', () => {
  it('accepts PNG files', () => {
    const file = createPngFile()
    expect(validateImageFile(file)).toBeNull()
  })

  it('accepts JPEG files', () => {
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    expect(validateImageFile(file)).toBeNull()
  })

  it('accepts WebP files', () => {
    const file = new File(['x'], 'test.webp', { type: 'image/webp' })
    expect(validateImageFile(file)).toBeNull()
  })

  it('rejects non-image files', () => {
    const file = new File(['x'], 'test.txt', { type: 'text/plain' })
    const err = validateImageFile(file)
    expect(err).not.toBeNull()
    expect(err!.code).toBe('VALIDATION_ERROR')
  })

  it('rejects oversized files', () => {
    const file = new File(['x'.repeat(21 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    const err = validateImageFile(file)
    expect(err).not.toBeNull()
    expect(err!.code).toBe('VALIDATION_ERROR')
  })
})

describe('buildEditsMultipartBody', () => {
  it('includes model gpt-image-2', () => {
    const formData = buildEditsMultipartBody({
      prompt: 'edit this',
      images: [createPngFile()],
    })

    expect(formData.get('model')).toBe('gpt-image-2')
  })

  it('includes prompt', () => {
    const formData = buildEditsMultipartBody({
      prompt: '  edit this  ',
      images: [createPngFile()],
    })

    expect(formData.get('prompt')).toBe('edit this')
  })

  it('includes response_format b64_json', () => {
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [createPngFile()],
    })

    expect(formData.get('response_format')).toBe('b64_json')
  })

  it('includes image files', () => {
    const file = createPngFile('photo.png')
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [file],
    })

    const entries = Array.from(formData.entries())
    const imageEntries = entries.filter(([key]) => key === 'image')
    expect(imageEntries.length).toBe(1)
  })

  it('includes multiple image files', () => {
    const files = [createPngFile('a.png'), createPngFile('b.png')]
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: files,
    })

    const entries = Array.from(formData.entries())
    const imageEntries = entries.filter(([key]) => key === 'image')
    expect(imageEntries.length).toBe(2)
  })

  it('includes mask when provided', () => {
    const mask = createPngFile('mask.png')
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [createPngFile()],
      mask,
    })

    expect(formData.get('mask')).toBeDefined()
  })

  it('omits mask when not provided', () => {
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [createPngFile()],
    })

    expect(formData.get('mask')).toBeNull()
  })

  it('includes optional params when provided', () => {
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [createPngFile()],
      size: '1024x1024',
      quality: 'high',
      background: 'transparent',
      output_format: 'webp',
      output_compression: 75,
    })

    expect(formData.get('size')).toBe('1024x1024')
    expect(formData.get('quality')).toBe('high')
    expect(formData.get('background')).toBe('transparent')
    expect(formData.get('output_format')).toBe('webp')
    expect(formData.get('output_compression')).toBe('75')
  })

  it('does not manually set Content-Type', () => {
    const formData = buildEditsMultipartBody({
      prompt: 'edit',
      images: [createPngFile()],
    })

    const entries = Array.from(formData.entries())
    const contentTypeEntries = entries.filter(([key]) => key === 'Content-Type')
    expect(contentTypeEntries.length).toBe(0)
  })
})

describe('sendEditsMultipartRequest', () => {
  it('sends to /v1/images/edits', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendEditsMultipartRequest(
      'sk-test',
      { prompt: 'edit', images: [createPngFile()] },
      mockFetch,
    )

    const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/v1/images/edits')
  })

  it('sends without Content-Type header (browser sets multipart boundary)', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendEditsMultipartRequest(
      'sk-test',
      { prompt: 'edit', images: [createPngFile()] },
      mockFetch,
    )

    const [, options] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers['Content-Type']).toBeUndefined()
    expect(options.headers['Authorization']).toBe('Bearer sk-test')
  })

  it('rejects empty images array', async () => {
    await expect(
      sendEditsMultipartRequest('sk-test', { prompt: 'edit', images: [] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects non-image files', async () => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' })
    await expect(
      sendEditsMultipartRequest(
        'sk-test',
        { prompt: 'edit', images: [textFile] },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects oversized files', async () => {
    const bigFile = new File(['x'.repeat(21 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    await expect(
      sendEditsMultipartRequest(
        'sk-test',
        { prompt: 'edit', images: [bigFile] },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects invalid mask files', async () => {
    const maskFile = new File(['x'], 'mask.txt', { type: 'text/plain' })
    await expect(
      sendEditsMultipartRequest(
        'sk-test',
        { prompt: 'edit', images: [createPngFile()], mask: maskFile },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('handles HTTP error responses', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 401,
      text: 'Unauthorized',
    })

    await expect(
      sendEditsMultipartRequest(
        'sk-test',
        { prompt: 'edit', images: [createPngFile()] },
        mockFetch,
      ),
    ).rejects.toMatchObject({ code: 'AUTH_FAILED' })
  })

  it('rejects HTTP 200 multipart edit response when body contains error', async () => {
    const apiKey = 'sub2api-multipart-key-123'
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: {
        error: { message: `Invalid key ${apiKey}`, code: 'invalid_api_key' },
        data: [{ b64_json: 'should-not-be-used' }],
      },
    })

    await expect(
      sendEditsMultipartRequest(
        apiKey,
        { prompt: 'edit', images: [createPngFile()] },
        mockFetch,
      ),
    ).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      debugHint: expect.not.stringContaining(apiKey),
    })
  })
})

describe('validateImageUrl', () => {
  it('accepts https URLs', () => {
    expect(validateImageUrl('https://example.com/img.png')).toBeNull()
  })

  it('accepts http URLs', () => {
    expect(validateImageUrl('http://example.com/img.png')).toBeNull()
  })

  it('rejects ftp URLs', () => {
    const err = validateImageUrl('ftp://example.com/img.png')
    expect(err).not.toBeNull()
    expect(err!.code).toBe('VALIDATION_ERROR')
  })

  it('rejects data URLs', () => {
    const err = validateImageUrl('data:image/png;base64,abc')
    expect(err).not.toBeNull()
    expect(err!.code).toBe('VALIDATION_ERROR')
  })

  it('rejects invalid URLs', () => {
    const err = validateImageUrl('not-a-url')
    expect(err).not.toBeNull()
    expect(err!.code).toBe('VALIDATION_ERROR')
  })

  it('rejects empty string', () => {
    const err = validateImageUrl('')
    expect(err).not.toBeNull()
  })
})

describe('buildEditsJsonBody', () => {
  it('includes model gpt-image-2', () => {
    const body = buildEditsJsonBody({ prompt: 'edit', imageUrls: ['https://example.com/img.png'] })
    expect(body.model).toBe('gpt-image-2')
  })

  it('includes prompt', () => {
    const body = buildEditsJsonBody({ prompt: '  edit this  ', imageUrls: ['https://example.com/img.png'] })
    expect(body.prompt).toBe('edit this')
  })

  it('includes response_format b64_json', () => {
    const body = buildEditsJsonBody({ prompt: 'edit', imageUrls: ['https://example.com/img.png'] })
    expect(body.response_format).toBe('b64_json')
  })

  it('builds images array with image_url', () => {
    const body = buildEditsJsonBody({
      prompt: 'edit',
      imageUrls: ['https://example.com/a.png', 'https://example.com/b.png'],
    })
    expect(body.images).toEqual([
      { image_url: 'https://example.com/a.png' },
      { image_url: 'https://example.com/b.png' },
    ])
  })

  it('includes mask.image_url when provided', () => {
    const body = buildEditsJsonBody({
      prompt: 'edit',
      imageUrls: ['https://example.com/img.png'],
      maskUrl: 'https://example.com/mask.png',
    })
    expect(body.mask).toEqual({ image_url: 'https://example.com/mask.png' })
  })

  it('omits mask when not provided', () => {
    const body = buildEditsJsonBody({
      prompt: 'edit',
      imageUrls: ['https://example.com/img.png'],
    })
    expect(body.mask).toBeUndefined()
  })

  it('includes optional params', () => {
    const body = buildEditsJsonBody({
      prompt: 'edit',
      imageUrls: ['https://example.com/img.png'],
      size: '1024x1024',
      quality: 'high',
      background: 'transparent',
      output_format: 'webp',
      output_compression: 75,
      n: 3,
    })
    expect(body.size).toBe('1024x1024')
    expect(body.quality).toBe('high')
    expect(body.background).toBe('transparent')
    expect(body.output_format).toBe('webp')
    expect(body.output_compression).toBe(75)
    expect(body.n).toBe(3)
  })
})

describe('sendEditsJsonRequest', () => {
  it('sends to /v1/images/edits', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendEditsJsonRequest(
      'sk-test',
      { prompt: 'edit', imageUrls: ['https://example.com/img.png'] },
      mockFetch,
    )

    const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/v1/images/edits')
  })

  it('sends JSON body with Content-Type header', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendEditsJsonRequest(
      'sk-test',
      { prompt: 'edit', imageUrls: ['https://example.com/img.png'] },
      mockFetch,
    )

    const [, options] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.headers['Authorization']).toBe('Bearer sk-test')
    const body = JSON.parse(options.body)
    expect(body.images[0].image_url).toBe('https://example.com/img.png')
  })

  it('rejects empty imageUrls', async () => {
    await expect(
      sendEditsJsonRequest('sk-test', { prompt: 'edit', imageUrls: [] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects invalid URLs', async () => {
    await expect(
      sendEditsJsonRequest('sk-test', { prompt: 'edit', imageUrls: ['ftp://bad.com'] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects invalid mask URL', async () => {
    await expect(
      sendEditsJsonRequest(
        'sk-test',
        { prompt: 'edit', imageUrls: ['https://example.com/img.png'], maskUrl: 'not-a-url' },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('handles multiple URLs', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: { data: [{ b64_json: 'abc' }] },
    })

    await sendEditsJsonRequest(
      'sk-test',
      {
        prompt: 'edit',
        imageUrls: ['https://a.com/1.png', 'https://b.com/2.png'],
      },
      mockFetch,
    )

    const [, options] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.images).toHaveLength(2)
  })

  it('handles HTTP error', async () => {
    const mockFetch = createMockFetch({
      ok: false,
      status: 429,
      text: 'Rate limited',
    })

    await expect(
      sendEditsJsonRequest(
        'sk-test',
        { prompt: 'edit', imageUrls: ['https://example.com/img.png'] },
        mockFetch,
      ),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })

  it('rejects HTTP 200 JSON edit response when body contains error', async () => {
    const apiKey = 'sub2api-json-key-123'
    const mockFetch = createMockFetch({
      ok: true,
      status: 200,
      json: {
        error: { message: `Invalid key ${apiKey}`, code: 'invalid_api_key' },
        data: [{ b64_json: 'should-not-be-used' }],
      },
    })

    await expect(
      sendEditsJsonRequest(
        apiKey,
        { prompt: 'edit', imageUrls: ['https://example.com/img.png'] },
        mockFetch,
      ),
    ).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      debugHint: expect.not.stringContaining(apiKey),
    })
  })

  it('handles network error', async () => {
    const mockFetch = createMockFetchNetworkError(new Error('Failed to fetch'))

    await expect(
      sendEditsJsonRequest(
        'sk-test',
        { prompt: 'edit', imageUrls: ['https://example.com/img.png'] },
        mockFetch,
      ),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })
})
