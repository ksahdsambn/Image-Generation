import { describe, expect, it } from 'vitest'
import type { ImageHistoryRecord } from '@/types/history'

describe('ImageHistoryRecord', () => {
  it('does not include API Key fields in serialized history metadata', () => {
    const record: Omit<ImageHistoryRecord, 'imageBlob' | 'thumbnailBlob'> = {
      id: 'history-1',
      prompt: 'A quiet studio',
      params: { size: '1024x1024' },
      model: 'gpt-image-2',
      size: '1024x1024',
      outputFormat: 'webp',
      createdAt: Date.now(),
      byteSize: 1024,
    }

    const serialized = JSON.stringify(record)

    expect(serialized).not.toContain('apiKey')
    expect(serialized).not.toContain('Authorization')
    expect(serialized).not.toContain('Bearer')
  })
})
