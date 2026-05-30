import { describe, it, expect } from 'vitest'
import {
  inferMimeType,
  inferFileExtension,
  b64ToBlob,
  generateFilename,
} from '@/utils/image-utils'

describe('inferMimeType', () => {
  it('returns image/png for png', () => {
    expect(inferMimeType('png')).toBe('image/png')
  })

  it('returns image/webp for webp', () => {
    expect(inferMimeType('webp')).toBe('image/webp')
  })

  it('returns image/jpeg for jpeg', () => {
    expect(inferMimeType('jpeg')).toBe('image/jpeg')
  })
})

describe('inferFileExtension', () => {
  it('returns .png for png', () => {
    expect(inferFileExtension('png')).toBe('.png')
  })

  it('returns .webp for webp', () => {
    expect(inferFileExtension('webp')).toBe('.webp')
  })

  it('returns .jpg for jpeg', () => {
    expect(inferFileExtension('jpeg')).toBe('.jpg')
  })
})

describe('b64ToBlob', () => {
  it('converts base64 string to Blob with correct MIME type', async () => {
    const b64 = btoa('hello world')
    const blob = b64ToBlob(b64, 'image/png')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    const text = await blob.text()
    expect(text).toBe('hello world')
  })

  it('converts base64 string to Blob with webp MIME type', async () => {
    const b64 = btoa('webp data')
    const blob = b64ToBlob(b64, 'image/webp')
    expect(blob.type).toBe('image/webp')
  })

  it('converts base64 string to Blob with jpeg MIME type', async () => {
    const b64 = btoa('jpeg data')
    const blob = b64ToBlob(b64, 'image/jpeg')
    expect(blob.type).toBe('image/jpeg')
  })

  it('handles binary data correctly', async () => {
    const binary = new Uint8Array([0, 127, 255, 128, 1])
    const b64 = btoa(String.fromCharCode(...binary))
    const blob = b64ToBlob(b64, 'image/png')
    const buffer = await blob.arrayBuffer()
    const result = new Uint8Array(buffer)
    expect(result).toEqual(binary)
  })
})

describe('generateFilename', () => {
  it('generates filename with png extension', () => {
    const name = generateFilename('png', 0)
    expect(name).toMatch(/^gpt-image-.*\.png$/)
  })

  it('generates filename with webp extension', () => {
    const name = generateFilename('webp', 0)
    expect(name).toMatch(/^gpt-image-.*\.webp$/)
  })

  it('generates filename with jpg extension for jpeg', () => {
    const name = generateFilename('jpeg', 0)
    expect(name).toMatch(/^gpt-image-.*\.jpg$/)
  })

  it('includes index in filename', () => {
    const name = generateFilename('png', 2)
    expect(name).toContain('-3')
  })
})
