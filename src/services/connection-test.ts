import { loadConfig } from '@/utils/config'
import { classifyHttpError, classifyNetworkError, type AppError } from '@/types/errors'

export interface ConnectionTestResult {
  success: boolean
  error: AppError | null
}

export async function testConnection(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<ConnectionTestResult> {
  const config = loadConfig()
  if (config.configError) {
    return {
      success: false,
      error: { code: 'CONFIG_ERROR', userMessage: config.configError, debugHint: '' },
    }
  }

  if (!apiKey.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', userMessage: '缺少 API Key', debugHint: '' },
    }
  }

  const url = `${config.sub2apiBaseUrl}/v1/models`

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      const appError = classifyHttpError(response.status, errorBody, [apiKey])
      return { success: false, error: appError }
    }

    const body = await response.text().catch(() => '')
    if (hasErrorBody(body)) {
      return { success: false, error: classifyHttpError(response.status, body, [apiKey]) }
    }

    return { success: true, error: null }
  } catch (error: unknown) {
    if (error instanceof TypeError || error instanceof Error) {
      return { success: false, error: classifyNetworkError(error, [apiKey]) }
    }
    return {
      success: false,
      error: classifyNetworkError(new Error(String(error)), [apiKey]),
    }
  }
}

function hasErrorBody(body: string): boolean {
  if (!body) return false
  try {
    const json = JSON.parse(body) as Record<string, unknown>
    return 'error' in json
  } catch {
    return false
  }
}
