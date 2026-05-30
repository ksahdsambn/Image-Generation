import Dexie, { type EntityTable } from 'dexie'
import type { HistoryRecord } from '@/types/history'

const DB_NAME = 'gpt-image-2-studio'
const DB_VERSION = 1

class ImageDatabase extends Dexie {
  history!: EntityTable<HistoryRecord, 'id'>

  constructor() {
    super(DB_NAME)
    this.version(DB_VERSION).stores({
      history: '++id, createdAt, prompt, outputFormat, size',
    })
  }
}

let dbInstance: ImageDatabase | null = null

export function getDatabase(): ImageDatabase {
  if (!dbInstance) {
    dbInstance = new ImageDatabase()
  }
  return dbInstance
}

export async function isIndexedDBAvailable(): Promise<boolean> {
  try {
    const db = getDatabase()
    await db.open()
    return db.isOpen()
  } catch {
    return false
  }
}

export { ImageDatabase, DB_NAME, DB_VERSION }
