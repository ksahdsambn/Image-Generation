import { describe, it, expect } from 'vitest'
import { parseApiResponse, releaseParsedResults } from '@/services/response-parser'

describe('parseApiResponse', () => {
  it('parses single image response', () => {
    const b64 = btoa('fake png data')
    const response = {
      data: [{ b64_json: b64 }],
    }

    const results = parseApiResponse(response, 'png')
    expect(results).toHaveLength(1)
    expect(results[0].blob).toBeInstanceOf(Blob)
    expect(results[0].mimeType).toBe('image/png')
    expect(results[0].objectUrl).toBeTruthy()
  })

  it('parses multi-image response', () => {
    const b64_1 = btoa('image1')
    const b64_2 = btoa('image2')
    const response = {
      data: [
        { b64_json: b64_1, revised_prompt: 'a cat' },
        { b64_json: b64_2, revised_prompt: 'a dog' },
      ],
    }

    const results = parseApiResponse(response, 'png')
    expect(results).toHaveLength(2)
    expect(results[0].revisedPrompt).toBe('a cat')
    expect(results[1].revisedPrompt).toBe('a dog')
  })

  it('saves revised_prompt to metadata', () => {
    const b64 = btoa('data')
    const response = {
      data: [{ b64_json: b64, revised_prompt: 'a revised prompt' }],
    }

    const results = parseApiResponse(response, 'png')
    expect(results[0].revisedPrompt).toBe('a revised prompt')
  })

  it('handles response without revised_prompt', () => {
    const b64 = btoa('data')
    const response = {
      data: [{ b64_json: b64 }],
    }

    const results = parseApiResponse(response, 'png')
    expect(results[0].revisedPrompt).toBeUndefined()
  })

  it('returns empty array for missing data', () => {
    expect(parseApiResponse({ data: undefined } as any, 'png')).toEqual([])
    expect(parseApiResponse({} as any, 'png')).toEqual([])
  })

  it('returns empty array for non-array data', () => {
    expect(parseApiResponse({ data: 'not an array' } as any, 'png')).toEqual([])
  })

  it('uses correct MIME type for webp', () => {
    const b64 = btoa('data')
    const response = { data: [{ b64_json: b64 }] }
    const results = parseApiResponse(response, 'webp')
    expect(results[0].mimeType).toBe('image/webp')
  })

  it('uses correct MIME type for jpeg', () => {
    const b64 = btoa('data')
    const response = { data: [{ b64_json: b64 }] }
    const results = parseApiResponse(response, 'jpeg')
    expect(results[0].mimeType).toBe('image/jpeg')
  })

  it('creates valid object URLs', () => {
    const b64 = btoa('data')
    const response = { data: [{ b64_json: b64 }] }
    const results = parseApiResponse(response, 'png')
    expect(results[0].objectUrl).toMatch(/^blob:/)
  })
})

describe('releaseParsedResults', () => {
  it('does not throw when called with valid results', () => {
    const b64 = btoa('data')
    const response = { data: [{ b64_json: b64 }] }
    const results = parseApiResponse(response, 'png')
    expect(() => releaseParsedResults(results)).not.toThrow()
  })

  it('does not throw for empty array', () => {
    expect(() => releaseParsedResults([])).not.toThrow()
  })
})
