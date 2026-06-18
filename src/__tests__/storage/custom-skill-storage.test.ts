import { describe, it, expect, beforeEach } from 'vitest'
import { getDatabase } from '@/storage/database'
import {
  listCustomSkills,
  getCustomSkill,
  saveCustomSkill,
  deleteCustomSkill,
} from '@/storage/custom-skill-storage'
import { CUSTOM_SKILL_ID_PREFIX } from '@/types/skill'

describe('custom-skill-storage CRUD', () => {
  beforeEach(async () => {
    const db = getDatabase()
    await db.customSkills.clear()
  })

  it('新建：成功落库，skillId 带前缀，字段完整', async () => {
    const result = await saveCustomSkill({
      name: '水彩',
      description: '水彩风格',
      content: '请按水彩风格生成',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.skillId.startsWith(CUSTOM_SKILL_ID_PREFIX)).toBe(true)
    expect(result.data!.name).toBe('水彩')
    expect(result.data!.content).toBe('请按水彩风格生成')
    expect(result.data!.pk).toBeGreaterThan(0)
    expect(result.data!.createdAt).toBeGreaterThan(0)
    expect(result.data!.updatedAt).toBe(result.data!.createdAt)
  })

  it('新建校验：名称为空失败', async () => {
    const result = await saveCustomSkill({ name: '   ', description: '', content: 'c' })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  it('新建校验：内容为空失败', async () => {
    const result = await saveCustomSkill({ name: 'n', description: '', content: '   ' })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  it('更新：传入既有 skillId 时覆盖 name/content/description 并推进 updatedAt', async () => {
    const created = await saveCustomSkill({ name: '旧名', description: '旧', content: '旧内容' })
    const skillId = created.data!.skillId

    // 等待 1ms 确保 updatedAt 不同
    await new Promise((r) => setTimeout(r, 2))

    const updated = await saveCustomSkill({ skillId, name: '新名', description: '新简介', content: '新内容' })
    expect(updated.success).toBe(true)
    expect(updated.data!.skillId).toBe(skillId)
    expect(updated.data!.name).toBe('新名')
    expect(updated.data!.content).toBe('新内容')
    expect(updated.data!.description).toBe('新简介')
    expect(updated.data!.updatedAt).toBeGreaterThan(updated.data!.createdAt)
    // 主键保持不变（同一条记录）
    expect(updated.data!.pk).toBe(created.data!.pk)
  })

  it('更新不存在的 skillId：失败', async () => {
    const result = await saveCustomSkill({
      skillId: `${CUSTOM_SKILL_ID_PREFIX}nope`,
      name: 'x',
      description: '',
      content: 'y',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  it('getCustomSkill：命中返回记录，未命中返回 null', async () => {
    const created = await saveCustomSkill({ name: 'A', description: '', content: 'a' })
    const hit = await getCustomSkill(created.data!.skillId)
    expect(hit.success).toBe(true)
    expect(hit.data?.name).toBe('A')

    const miss = await getCustomSkill(`${CUSTOM_SKILL_ID_PREFIX}missing`)
    expect(miss.success).toBe(true)
    expect(miss.data).toBeNull()
  })

  it('listCustomSkills：按 updatedAt 倒序', async () => {
    await saveCustomSkill({ name: '旧', description: '', content: '1' })
    await new Promise((r) => setTimeout(r, 2))
    await saveCustomSkill({ name: '新', description: '', content: '2' })
    const list = await listCustomSkills()
    expect(list.success).toBe(true)
    expect(list.data!.length).toBe(2)
    expect(list.data![0].name).toBe('新')
    expect(list.data![1].name).toBe('旧')
  })

  it('deleteCustomSkill：删除成功返回 true，再次删除返回 false', async () => {
    const created = await saveCustomSkill({ name: '待删', description: '', content: 'x' })
    const sid = created.data!.skillId
    const del = await deleteCustomSkill(sid)
    expect(del.success).toBe(true)
    expect(del.data).toBe(true)
    const again = await deleteCustomSkill(sid)
    expect(again.success).toBe(true)
    expect(again.data).toBe(false)
  })
})
