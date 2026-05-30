import { isIndexedDBAvailable } from '@/storage/database'

let _available: boolean | null = null

export async function checkStorageAvailability(): Promise<{ available: boolean; message?: string }> {
  try {
    const available = await isIndexedDBAvailable()
    _available = available
    if (!available) {
      return { available: false, message: '浏览器不支持 IndexedDB，本地历史功能不可用，但当前生成结果仍可下载' }
    }
    return { available: true }
  } catch {
    _available = false
    return { available: false, message: 'IndexedDB 初始化失败，本地历史功能不可用，但当前生成结果仍可下载' }
  }
}

export function getCachedAvailability(): boolean | null {
  return _available
}
