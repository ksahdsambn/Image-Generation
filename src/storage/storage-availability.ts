import { isIndexedDBAvailable } from '@/storage/database'
import { i18n } from '@/i18n'

let _available: boolean | null = null

/**
 * 检查本地存储可用性。
 * messageKey 返回 i18n 的 key（'historyStorage.unsupported' / 'historyStorage.initFailed'），
 * HistoryPanel 模板可用 t(messageKey) 直接渲染，切换语言时自动跟随；
 * message 同时返回当前语言的即时文案（向后兼容/非响应式场景）。
 */
export async function checkStorageAvailability(): Promise<{ available: boolean; messageKey?: string; message?: string }> {
  try {
    const available = await isIndexedDBAvailable()
    _available = available
    if (!available) {
      const key = 'historyStorage.unsupported'
      return { available: false, messageKey: key, message: i18n.global.t(key) }
    }
    return { available: true }
  } catch {
    _available = false
    const key = 'historyStorage.initFailed'
    return { available: false, messageKey: key, message: i18n.global.t(key) }
  }
}

export function getCachedAvailability(): boolean | null {
  return _available
}
