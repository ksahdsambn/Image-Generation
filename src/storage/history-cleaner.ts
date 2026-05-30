import { getDatabase } from '@/storage/database'
import { loadConfig } from '@/utils/config'

export async function enforceHistoryLimits(): Promise<{ deletedCount: number; reason?: string }> {
  const config = loadConfig()
  const db = getDatabase()

  const totalCount = await db.history.count()
  if (totalCount === 0) return { deletedCount: 0 }

  let deletedCount = 0

  if (totalCount > config.historyMaxItems) {
    const records = await db.history.orderBy('createdAt').toArray()
    const toDelete = records.slice(0, totalCount - config.historyMaxItems)
    for (const r of toDelete) {
      if (r.id != null) {
        await db.history.delete(r.id)
        deletedCount++
      }
    }
  }

  const remaining = await db.history.toArray()
  let totalBytes = 0
  for (const r of remaining) {
    totalBytes += r.imageBytes
  }

  if (totalBytes > config.historyMaxBytes) {
    const sorted = [...remaining].sort((a, b) => a.createdAt - b.createdAt)
    for (const r of sorted) {
      if (totalBytes <= config.historyMaxBytes) break
      if (r.id != null) {
        await db.history.delete(r.id)
        totalBytes -= r.imageBytes
        deletedCount++
      }
    }
  }

  return { deletedCount }
}
