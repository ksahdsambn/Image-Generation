import { getDatabase } from '@/storage/database'

export async function deleteHistoryRecord(id: number): Promise<boolean> {
  const db = getDatabase()
  const existing = await db.history.get(id)
  if (!existing) return false
  await db.history.delete(id)
  return true
}

export async function clearAllHistory(): Promise<void> {
  const db = getDatabase()
  await db.history.clear()
}
