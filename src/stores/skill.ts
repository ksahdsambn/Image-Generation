import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppError } from '@/types/errors'
import { loadSkillContent } from '@/services/skill-loader'
import {
  builtinSkillOptions,
  isCustomSkillId,
  SKILL_NONE,
  SKILL_PROMPT_SEPARATOR,
  SKILL_USER_INPUT_LEAD,
  type CustomSkillRecord,
  type SkillOption,
} from '@/types/skill'
import {
  deleteCustomSkill,
  listCustomSkills,
  saveCustomSkill,
} from '@/storage/custom-skill-storage'

/** 内联编辑器的草稿状态：null 表示未在编辑。 */
export interface SkillDraft {
  /** 编辑既有 skill 时为其 skillId；新建时为 null */
  skillId: string | null
  name: string
  description: string
  content: string
}

/**
 * Skill 规范状态管理。
 *
 * 数据来源有两类：
 *  - 内置 skill（builtin）：静态 .md 文件，只读，通过 fetch 加载并内存缓存。
 *  - 自定义 skill：用户在 UI 内联编辑、存于 IndexedDB，可增删改。
 *
 * applySkillToPrompt 是注入逻辑的唯一出口：未启用 / 未选择 / 内容缺失时
 * 严格原样返回用户输入，保证不影响现有生图行为。
 */
export const useSkillStore = defineStore('skill', () => {
  /** 是否启用 skill 注入，默认关闭 */
  const enabled = ref(false)
  /** 当前选中的 skill id，'' 表示未选择 */
  const selectedId = ref<string>(SKILL_NONE)
  /** 已加载的内置 skill 内容缓存：id -> 规范文本 */
  const builtinContentCache = ref<Record<string, string>>({})
  /** 自定义 skill 列表（来自 IndexedDB） */
  const customSkills = ref<CustomSkillRecord[]>([])
  /** 加载中标志（内置 fetch） */
  const loading = ref(false)
  /** 最近一次加载/保存错误 */
  const error = ref<AppError | null>(null)
  /** 内联编辑草稿；非 null 时 UI 展开编辑区 */
  const draft = ref<SkillDraft | null>(null)
  /** 保存草稿时的 pending 标志 */
  const saving = ref(false)

  /** 内置清单（只读视图） */
  const builtinOptions = builtinSkillOptions()

  /** 合并后的全部 skill 选项（内置在前，自定义在后），供 UI 下拉使用 */
  const allSkills = computed<SkillOption[]>(() => [
    ...builtinOptions,
    ...customSkills.value.map((r) => ({
      id: r.skillId,
      name: r.name,
      description: r.description,
      builtin: false,
    })),
  ])

  /** 当前选中的 skill 是否已加载（内置命中缓存，或自定义命中列表） */
  function isLoaded(id: string): boolean {
    if (!id) return false
    if (isCustomSkillId(id)) {
      return customSkills.value.some((r) => r.skillId === id)
    }
    return Boolean(builtinContentCache.value[id])
  }

  /** 取某个 skill 的实际内容文本，找不到返回空字符串 */
  function getSkillContent(id: string): string {
    if (!id) return ''
    if (isCustomSkillId(id)) {
      return customSkills.value.find((r) => r.skillId === id)?.content ?? ''
    }
    return builtinContentCache.value[id] ?? ''
  }

  /**
   * 切换选中的 skill。
   *  - 空 id：清空选择
   *  - 自定义 skill：直接来自 customSkills，无需 fetch
   *  - 内置 skill：未缓存则 fetch（已缓存则跳过）
   */
  async function selectSkill(id: string, fetchFn?: typeof fetch): Promise<void> {
    error.value = null
    selectedId.value = id
    if (!id) return
    if (isCustomSkillId(id)) return
    if (builtinContentCache.value[id]) return

    loading.value = true
    try {
      const { content } = await loadSkillContent(id, fetchFn)
      builtinContentCache.value = { ...builtinContentCache.value, [id]: content }
    } catch (err) {
      error.value = err as AppError
      selectedId.value = SKILL_NONE
    } finally {
      loading.value = false
    }
  }

  /** 切换启用开关 */
  function toggleEnabled(value?: boolean): void {
    enabled.value = typeof value === 'boolean' ? value : !enabled.value
  }

  /** 清空当前选择 */
  function clearSelection(): void {
    selectedId.value = SKILL_NONE
    error.value = null
  }

  /**
   * 将 skill 规范拼接到用户 prompt 前面。
   *  - 未启用 / 未选择 / 内容缺失：原样返回 rawPrompt
   *  - 启用且内容就绪：`<内容><分隔符>用户需求：<rawPrompt>`
   */
  function applySkillToPrompt(rawPrompt: string): string {
    if (!enabled.value || !selectedId.value) return rawPrompt
    const content = getSkillContent(selectedId.value)
    if (!content) return rawPrompt
    return `${content}${SKILL_PROMPT_SEPARATOR}${SKILL_USER_INPUT_LEAD}${rawPrompt}`
  }

  /** 从 IndexedDB 拉取自定义 skill 列表，应用启动时调用一次。 */
  async function loadCustomSkills(): Promise<void> {
    const result = await listCustomSkills()
    if (result.success && result.data) {
      customSkills.value = result.data
    } else if (result.error) {
      // 加载失败不阻断 UI，记录到 error 供提示
      error.value = result.error
    }
  }

  /** 开始新建：打开内联编辑区并初始化空草稿 */
  function startCreate(): void {
    draft.value = { skillId: null, name: '', description: '', content: '' }
  }

  /** 开始编辑某个自定义 skill：用其内容填充草稿 */
  function startEdit(skillId: string): void {
    const record = customSkills.value.find((r) => r.skillId === skillId)
    if (!record) return
    draft.value = {
      skillId: record.skillId,
      name: record.name,
      description: record.description,
      content: record.content,
    }
  }

  /** 关闭编辑区，丢弃草稿 */
  function cancelEdit(): void {
    draft.value = null
  }

  /** 保存草稿（新增或更新），成功后刷新列表并关闭编辑区 */
  async function saveDraft(): Promise<boolean> {
    if (!draft.value) return false
    saving.value = true
    error.value = null
    try {
      const result = await saveCustomSkill({
        skillId: draft.value.skillId,
        name: draft.value.name,
        description: draft.value.description,
        content: draft.value.content,
      })
      if (!result.success || !result.data) {
        error.value = result.error ?? { code: 'STORAGE_ERROR', userMessage: '保存 Skill 失败', debugHint: '' }
        return false
      }
      await loadCustomSkills()
      draft.value = null
      return true
    } finally {
      saving.value = false
    }
  }

  /** 删除某个自定义 skill；若它正被选中则清空选择 */
  async function removeCustomSkill(skillId: string): Promise<boolean> {
    const result = await deleteCustomSkill(skillId)
    if (!result.success) {
      error.value = result.error ?? { code: 'STORAGE_ERROR', userMessage: '删除 Skill 失败', debugHint: '' }
      return false
    }
    if (selectedId.value === skillId) {
      selectedId.value = SKILL_NONE
    }
    await loadCustomSkills()
    return true
  }

  return {
    enabled,
    selectedId,
    customSkills,
    loading,
    error,
    draft,
    saving,
    allSkills,
    isLoaded,
    getSkillContent,
    selectSkill,
    toggleEnabled,
    clearSelection,
    applySkillToPrompt,
    loadCustomSkills,
    startCreate,
    startEdit,
    cancelEdit,
    saveDraft,
    removeCustomSkill,
  }
})
