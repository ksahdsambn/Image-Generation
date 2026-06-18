import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillStore } from '@/stores/skill'
import { clearSkillCache } from '@/services/skill-loader'
import {
  SKILL_MANIFEST,
  SKILL_NONE,
  SKILL_PROMPT_SEPARATOR,
  SKILL_USER_INPUT_LEAD,
  CUSTOM_SKILL_ID_PREFIX,
  isCustomSkillId,
} from '@/types/skill'

function makeFetchOk(text: string) {
  return (() =>
    Promise.resolve(
      new Response(text, { status: 200, headers: { 'Content-Type': 'text/markdown' } }),
    )) as unknown as typeof fetch
}

function makeFetchFail(status = 404) {
  return (() =>
    Promise.resolve(new Response('Not Found', { status }))) as unknown as typeof fetch
}

describe('skill manifest & helpers', () => {
  it('内置清单非空且每个条目字段完整', () => {
    expect(SKILL_MANIFEST.length).toBeGreaterThan(0)
    for (const entry of SKILL_MANIFEST) {
      expect(entry.id.length).toBeGreaterThan(0)
      expect(entry.filename.endsWith('.md')).toBe(true)
    }
  })

  it('isCustomSkillId 按前缀判定', () => {
    expect(isCustomSkillId(`${CUSTOM_SKILL_ID_PREFIX}abc`)).toBe(true)
    expect(isCustomSkillId('photography')).toBe(false)
    expect(isCustomSkillId('')).toBe(false)
  })
})

describe('useSkillStore.applySkillToPrompt (内置 skill)', () => {
  let store: ReturnType<typeof useSkillStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    clearSkillCache()
    store = useSkillStore()
  })

  it('默认关闭：原样返回用户 prompt', () => {
    const prompt = '一只在屋顶上的猫'
    expect(store.applySkillToPrompt(prompt)).toBe(prompt)
  })

  it('启用但未选择 skill：原样返回', () => {
    store.toggleEnabled(true)
    const prompt = '一只在屋顶上的猫'
    expect(store.applySkillToPrompt(prompt)).toBe(prompt)
  })

  it('已选择但内容尚未加载：原样返回，避免发空前缀', () => {
    store.toggleEnabled(true)
    ;(store as unknown as { selectedId: string }).selectedId = SKILL_MANIFEST[0].id
    expect(store.applySkillToPrompt('p')).toBe('p')
  })

  it('启用 + 已加载：返回 内容+分隔符+引导行+用户输入', async () => {
    const id = SKILL_MANIFEST[0].id
    store.toggleEnabled(true)
    await store.selectSkill(id, makeFetchOk('# 规范\n保持写实。'))
    const prompt = '一只在屋顶上的猫'
    expect(store.applySkillToPrompt(prompt)).toBe(
      `# 规范\n保持写实。${SKILL_PROMPT_SEPARATOR}${SKILL_USER_INPUT_LEAD}${prompt}`,
    )
  })
})

describe('useSkillStore.selectSkill (内置)', () => {
  let store: ReturnType<typeof useSkillStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    clearSkillCache()
    store = useSkillStore()
  })

  it('加载成功：写入缓存，清空 error', async () => {
    const id = SKILL_MANIFEST[0].id
    await store.selectSkill(id, makeFetchOk('# 摄影\n写实要求。'))
    expect(store.isLoaded(id)).toBe(true)
    expect(store.error).toBeNull()
  })

  it('命中缓存：不重复请求', async () => {
    const id = SKILL_MANIFEST[0].id
    let callCount = 0
    const fetchFn = (() => {
      callCount++
      return Promise.resolve(new Response('规范', { status: 200 }))
    }) as unknown as typeof fetch
    await store.selectSkill(id, fetchFn)
    store.clearSelection()
    await store.selectSkill(id, fetchFn)
    expect(callCount).toBe(1)
  })

  it('加载失败：设置 error 并回退 selectedId', async () => {
    const id = SKILL_MANIFEST[0].id
    await store.selectSkill(id, makeFetchFail(404))
    expect(store.selectedId).toBe(SKILL_NONE)
    expect(store.error?.code).toBe('NETWORK_ERROR')
  })

  it('传入空 id：清空选择且不请求', async () => {
    store.toggleEnabled(true)
    await store.selectSkill(SKILL_MANIFEST[0].id, makeFetchOk('规范'))
    await store.selectSkill(SKILL_NONE)
    expect(store.selectedId).toBe(SKILL_NONE)
  })
})

describe('useSkillStore 自定义 skill（注入 + 选择）', () => {
  let store: ReturnType<typeof useSkillStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    clearSkillCache()
    store = useSkillStore()
    // 直接注入一条自定义 skill 到 store，绕过 IndexedDB（注入逻辑测试与存储解耦）
    ;(store as unknown as { customSkills: { skillId: string; name: string; description: string; content: string }[] }).customSkills = [
      { skillId: `${CUSTOM_SKILL_ID_PREFIX}1`, name: '水彩', description: '水彩风', content: '水彩规范内容' },
    ]
  })

  it('allSkills 合并内置与自定义，且 builtin 标记正确', () => {
    const ids = store.allSkills.map((s) => s.id)
    expect(ids).toContain(SKILL_MANIFEST[0].id)
    expect(ids).toContain(`${CUSTOM_SKILL_ID_PREFIX}1`)
    const custom = store.allSkills.find((s) => s.id === `${CUSTOM_SKILL_ID_PREFIX}1`)
    expect(custom?.builtin).toBe(false)
    const builtin = store.allSkills.find((s) => s.id === SKILL_MANIFEST[0].id)
    expect(builtin?.builtin).toBe(true)
  })

  it('选择自定义 skill：无需 fetch，直接生效', async () => {
    const sid = `${CUSTOM_SKILL_ID_PREFIX}1`
    store.toggleEnabled(true)
    await store.selectSkill(sid)
    expect(store.selectedId).toBe(sid)
    expect(store.isLoaded(sid)).toBe(true)
    expect(store.error).toBeNull()
  })

  it('applySkillToPrompt 对自定义 skill 生效，格式与内置一致', async () => {
    const sid = `${CUSTOM_SKILL_ID_PREFIX}1`
    store.toggleEnabled(true)
    await store.selectSkill(sid)
    const result = store.applySkillToPrompt('画一只猫')
    expect(result).toBe(`水彩规范内容${SKILL_PROMPT_SEPARATOR}${SKILL_USER_INPUT_LEAD}画一只猫`)
  })

  it('选择不存在的自定义 skill：isLoaded 返回 false，注入原样返回', () => {
    store.toggleEnabled(true)
    ;(store as unknown as { selectedId: string }).selectedId = `${CUSTOM_SKILL_ID_PREFIX}missing`
    expect(store.isLoaded(`${CUSTOM_SKILL_ID_PREFIX}missing`)).toBe(false)
    expect(store.applySkillToPrompt('p')).toBe('p')
  })
})

describe('useSkillStore 编辑草稿', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearSkillCache()
  })

  it('startCreate 打开草稿，cancelEdit 关闭', () => {
    const store = useSkillStore()
    expect(store.draft).toBeNull()
    store.startCreate()
    expect(store.draft).not.toBeNull()
    expect(store.draft?.skillId).toBeNull()
    store.cancelEdit()
    expect(store.draft).toBeNull()
  })

  it('startEdit 用既有记录填充草稿', () => {
    const store = useSkillStore()
    ;(store as unknown as { customSkills: { skillId: string; name: string; description: string; content: string }[] }).customSkills = [
      { skillId: `${CUSTOM_SKILL_ID_PREFIX}x`, name: '旧名', description: '旧简介', content: '旧内容' },
    ]
    store.startEdit(`${CUSTOM_SKILL_ID_PREFIX}x`)
    expect(store.draft?.name).toBe('旧名')
    expect(store.draft?.skillId).toBe(`${CUSTOM_SKILL_ID_PREFIX}x`)
  })

  it('startEdit 不存在的 skill：不打开草稿', () => {
    const store = useSkillStore()
    store.startEdit(`${CUSTOM_SKILL_ID_PREFIX}none`)
    expect(store.draft).toBeNull()
  })
})
