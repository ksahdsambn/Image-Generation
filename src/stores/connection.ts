import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppError } from '@/types/errors'
import { testConnection } from '@/services/connection-test'

export type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error'

export const useConnectionStore = defineStore('connection', () => {
  const status = ref<ConnectionStatus>('idle')
  const error = ref<AppError | null>(null)

  async function runTest(
    apiKey: string,
    fetchFn?: typeof fetch,
  ): Promise<boolean> {
    status.value = 'testing'
    error.value = null

    const result = await testConnection(apiKey, fetchFn)

    if (result.success) {
      status.value = 'connected'
      error.value = null
      return true
    } else {
      status.value = 'error'
      error.value = result.error
      return false
    }
  }

  function reset() {
    status.value = 'idle'
    error.value = null
  }

  return {
    status,
    error,
    runTest,
    reset,
  }
})
