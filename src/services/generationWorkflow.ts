import { createAppError, type AppError } from '@/errors/appError'
import type { ImageApiResult } from '@/services/imageApi'
import type { NormalizedGenerationParams } from '@/types/generation'
import type { ImageHistoryRecord } from '@/types/history'
import { convertApiResultsToImages, type ConvertedImageResult } from '@/utils/imageResult'

export type GenerationWorkflowClient = {
  submit: (params: NormalizedGenerationParams) => Promise<ImageApiResult[]>
}

export type GenerationWorkflowOptions = {
  client: GenerationWorkflowClient
  params: NormalizedGenerationParams
  saveHistory: (images: ConvertedImageResult[], params: NormalizedGenerationParams) => Promise<ImageHistoryRecord[]>
  createdAt?: number
}

export type GenerationWorkflowResult = {
  images: ConvertedImageResult[]
  historyRecords: ImageHistoryRecord[]
  historyError: AppError | null
}

export async function runGenerationWorkflow(options: GenerationWorkflowOptions): Promise<GenerationWorkflowResult> {
  const apiResults = await options.client.submit(options.params)
  const images = convertApiResultsToImages(apiResults, options.params.output_format, options.createdAt)

  try {
    const historyRecords = await options.saveHistory(images, options.params)
    return {
      images,
      historyRecords,
      historyError: null,
    }
  } catch {
    return {
      images,
      historyRecords: [],
      historyError: createAppError('storage'),
    }
  }
}
