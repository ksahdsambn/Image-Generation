import { describe, expect, it, vi } from 'vitest'
import { runGenerationWorkflow } from '@/services/generationWorkflow'
import { IMAGE_MODEL, IMAGE_RESPONSE_FORMAT, type NormalizedGenerationParams } from '@/types/generation'

const baseParams: NormalizedGenerationParams = {
  model: IMAGE_MODEL,
  response_format: IMAGE_RESPONSE_FORMAT,
  prompt: 'Workflow prompt',
  size: '1024x1024',
  n: 1,
  quality: 'auto',
  background: 'auto',
  output_format: 'png',
  referenceImages: [],
  imageUrls: [],
  maskImage: null,
  maskImageUrl: '',
}

function toBase64(bytes: number[]) {
  return btoa(String.fromCharCode(...bytes))
}

describe('generation workflow', () => {
  it('writes successful API results to current images and history', async () => {
    const submit = vi.fn().mockResolvedValue([{ b64Json: toBase64([0x89, 0x50, 0x4e, 0x47]) }])
    const saveHistory = vi.fn().mockResolvedValue([{ id: 'history-1' }])

    const result = await runGenerationWorkflow({
      client: { submit },
      params: baseParams,
      saveHistory,
      createdAt: 123,
    })

    expect(submit).toHaveBeenCalledWith(baseParams)
    expect(result.images[0]).toMatchObject({
      id: '123-01',
      extension: 'png',
    })
    expect(saveHistory).toHaveBeenCalledWith(result.images, baseParams)
    expect(result.historyError).toBeNull()
  })

  it('does not write history when the API request fails', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('request failed'))
    const saveHistory = vi.fn()

    await expect(
      runGenerationWorkflow({
        client: { submit },
        params: baseParams,
        saveHistory,
      }),
    ).rejects.toThrow('request failed')
    expect(saveHistory).not.toHaveBeenCalled()
  })

  it('keeps current results when history writing fails', async () => {
    const submit = vi.fn().mockResolvedValue([{ b64Json: toBase64([0x89, 0x50, 0x4e, 0x47]) }])
    const saveHistory = vi.fn().mockRejectedValue(new Error('quota'))

    const result = await runGenerationWorkflow({
      client: { submit },
      params: baseParams,
      saveHistory,
      createdAt: 456,
    })

    expect(result.images).toHaveLength(1)
    expect(result.historyRecords).toEqual([])
    expect(result.historyError).toMatchObject({ code: 'storage' })
  })
})
