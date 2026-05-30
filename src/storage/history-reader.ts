import { getDatabase } from '@/storage/database'
import type { HistoryRecord, HistoryQueryParams, HistoryQueryResult } from '@/types/history'

const DEFAULT_PAGE_SIZE = 20

export async function queryHistory(params: HistoryQueryParams = {}): Promise<HistoryQueryResult> {
  const db = getDatabase()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const searchText = params.searchText?.trim() || undefined
  const startDate = params.startDate ?? null
  const endDate = params.endDate ?? null

  let collection = db.history.orderBy('createdAt').reverse()

  let allRecords = await collection.toArray()

  if (startDate != null) {
    allRecords = allRecords.filter(r => r.createdAt >= startDate)
  }

  if (endDate != null) {
    allRecords = allRecords.filter(r => r.createdAt <= endDate)
  }

  if (searchText) {
    const lower = searchText.toLowerCase()
    allRecords = allRecords.filter(r => r.prompt.toLowerCase().includes(lower))
  }

  const total = allRecords.length
  const offset = (page - 1) * pageSize
  const records = allRecords.slice(offset, offset + pageSize)
  const hasMore = offset + pageSize < total

  return { records, total, page, pageSize, hasMore }
}

export async function getHistoryById(id: number): Promise<HistoryRecord | undefined> {
  const db = getDatabase()
  return db.history.get(id)
}

export async function getHistoryCount(): Promise<number> {
  const db = getDatabase()
  return db.history.count()
}

export async function getTotalBytes(): Promise<number> {
  const db = getDatabase()
  const records = await db.history.toArray()
  let total = 0
  for (const r of records) {
    total += r.imageBytes
  }
  return total
}
