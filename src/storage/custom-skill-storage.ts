import { getDatabase } from '@/storage/database'
import { classifyStorageError, type AppError } from '@/types/errors'
import { CUSTOM_SKILL_ID_PREFIX, type CustomSkillRecord } from '@/types/skill'

export interface SaveCustomSkillInput {
  /** 编辑时传入既有 skillId；新建时传 null，由本函数生成 */
  skillId?: string | null
  name: string
  description: string
  content: string
}

export interface CustomSkillResult<T> {
  success: boolean
  data?: T
  error?: AppError
}

function generateSkillId(): string {
  // 用时间戳 + 随机数，加前缀，避免与内置清单 id 冲突
  return `${CUSTOM_SKILL_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 列出全部自定义 skill，按更新时间倒序。 */
export async function listCustomSkills(): Promise<CustomSkillResult<CustomSkillRecord[]>> {
  try {
    const db = getDatabase()
    const records = await db.customSkills.orderBy('updatedAt').reverse().toArray()
    return { success: true, data: records }
  } catch (error) {
    return { success: false, error: classifyStorageError(error instanceof Error ? error : new Error(String(error))) }
  }
}

/** 按 skillId 取单条。 */
export async function getCustomSkill(skillId: string): Promise<CustomSkillResult<CustomSkillRecord | null>> {
  try {
    const db = getDatabase()
    const record = await db.customSkills.where('skillId').equals(skillId).first()
    return { success: true, data: record ?? null }
  } catch (error) {
    return { success: false, error: classifyStorageError(error instanceof Error ? error : new Error(String(error))) }
  }
}

/** 新增或更新自定义 skill；返回落库后的完整记录。 */
export async function saveCustomSkill(input: SaveCustomSkillInput): Promise<CustomSkillResult<CustomSkillRecord>> {
  const name = input.name.trim()
  const content = input.content.trim()
  if (!name) {
    return { success: false, error: { code: 'VALIDATION_ERROR', userMessage: 'Skill 名称不能为空', debugHint: '' } }
  }
  if (!content) {
    return { success: false, error: { code: 'VALIDATION_ERROR', userMessage: 'Skill 内容不能为空', debugHint: '' } }
  }

  try {
    const db = getDatabase()
    const now = Date.now()
    const skillId = input.skillId ?? generateSkillId()

    if (input.skillId) {
      const existing = await db.customSkills.where('skillId').equals(input.skillId).first()
      if (!existing || existing.pk === undefined) {
        return { success: false, error: { code: 'VALIDATION_ERROR', userMessage: '要编辑的 Skill 不存在', debugHint: '' } }
      }
      const updated: CustomSkillRecord = {
        ...existing,
        name,
        description: input.description.trim(),
        content,
        updatedAt: now,
      }
      await db.customSkills.put(updated)
      return { success: true, data: updated }
    }

    const record: CustomSkillRecord = {
      skillId,
      name,
      description: input.description.trim(),
      content,
      createdAt: now,
      updatedAt: now,
    }
    const pk = await db.customSkills.add(record)
    return { success: true, data: { ...record, pk } }
  } catch (error) {
    return { success: false, error: classifyStorageError(error instanceof Error ? error : new Error(String(error))) }
  }
}

/** 按 skillId 删除；返回是否实际删除了一条。 */
export async function deleteCustomSkill(skillId: string): Promise<CustomSkillResult<boolean>> {
  try {
    const db = getDatabase()
    const existing = await db.customSkills.where('skillId').equals(skillId).first()
    if (!existing || existing.pk === undefined) {
      return { success: true, data: false }
    }
    await db.customSkills.delete(existing.pk)
    return { success: true, data: true }
  } catch (error) {
    return { success: false, error: classifyStorageError(error instanceof Error ? error : new Error(String(error))) }
  }
}
