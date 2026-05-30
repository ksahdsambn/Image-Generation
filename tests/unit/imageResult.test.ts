import { describe, expect, it, vi } from 'vitest'
import {
  base64ToBlob,
  convertApiResultsToImages,
  createPreviewImages,
  getImageExtension,
  inferImageMimeType,
  revokePreviewImages,
} from '@/utils/imageResult'

function toBase64(bytes: number[]) {
  return btoa(String.fromCharCode(...bytes))
}

describe('image result utilities', () => {
  it('converts png base64 into a png Blob', async () => {
    const { blob, mimeType } = base64ToBlob(toBase64([0x89, 0x50, 0x4e, 0x47, 0x00]), 'webp')

    expect(mimeType).toBe('image/png')
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(5)
  })

  it('infers webp and jpeg MIME types from signatures', () => {
    expect(inferImageMimeType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00]), 'png')).toBe('image/webp')
    expect(inferImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), 'png')).toBe('image/jpeg')
  })

  it('falls back to requested output format when signature is unknown', () => {
    const { blob, mimeType } = base64ToBlob(toBase64([0x01, 0x02, 0x03]), 'jpeg')

    expect(mimeType).toBe('image/jpeg')
    expect(blob.type).toBe('image/jpeg')
    expect(getImageExtension(mimeType)).toBe('jpeg')
  })

  it('converts multiple API results and preserves revised prompts', () => {
    const images = convertApiResultsToImages(
      [
        { b64Json: toBase64([0x89, 0x50, 0x4e, 0x47]), revisedPrompt: 'revised' },
        { b64Json: toBase64([0x52, 0x49, 0x46, 0x46]) },
      ],
      'webp',
      123,
    )

    expect(images).toHaveLength(2)
    expect(images[0]).toMatchObject({
      id: '123-01',
      extension: 'png',
      fileName: 'gpt-image-2-123-01.png',
      revisedPrompt: 'revised',
    })
    expect(images[1]).toMatchObject({
      id: '123-02',
      extension: 'webp',
      fileName: 'gpt-image-2-123-02.webp',
    })
  })

  it('creates and revokes preview object URLs', () => {
    const createObjectUrl = vi.fn((blob: Blob) => `blob:${blob.type}`)
    const revokeObjectUrl = vi.fn()
    const images = convertApiResultsToImages([{ b64Json: toBase64([0x01]) }], 'png', 123)

    const previews = createPreviewImages(images, createObjectUrl)
    revokePreviewImages(previews, revokeObjectUrl)

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(previews[0].objectUrl).toBe('blob:image/png')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:image/png')
  })
})
