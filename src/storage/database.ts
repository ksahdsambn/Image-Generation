import Dexie, { type EntityTable } from 'dexie'
import type { HistoryRecord } from '@/types/history'
import type { CustomSkillRecord } from '@/types/skill'

const DB_NAME = 'gpt-image-2-studio'
const DB_VERSION = 2

class ImageDatabase extends Dexie {
  history!: EntityTable<HistoryRecord, 'id'>
  customSkills!: EntityTable<CustomSkillRecord, 'pk'>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      history: '++id, createdAt, prompt, outputFormat, size',
    })
    // v2: 新增 customSkills 表（保留 history 表结构不变，平滑升级）
    this.version(2).stores({
      history: '++id, createdAt, prompt, outputFormat, size',
      customSkills: '++pk, skillId, updatedAt',
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
