/**
 * Skill 元数据清单与类型定义。
 *
 * Skill 是一段 Markdown 文本，作为前缀拼接到用户 prompt 前面一起发给 API，
 * 用于在生图时统一注入某种风格/规范约束。
 *
 * 内置 skill 文件放在 public/skills/ 下，运行时通过 fetch 读取，
 * 增删 skill 只需修改 SKILL_MANIFEST 并在 public/skills/ 增删对应文件。
 */

export interface SkillManifestEntry {
  /** 唯一标识，建议与文件名（去扩展名）一致，例如 'photography' */
  id: string
  /** 下拉显示名，例如「摄影写实」 */
  name: string
  /** public/skills/ 下的文件名，例如 'photography.md' */
  filename: string
  /** 简介，用于在 UI 上提示该 skill 的用途 */
  description: string
}

/** 内置 skill 清单。新增 skill 在此追加，并把 .md 文件放到 public/skills/ 即可。 */
export const SKILL_MANIFEST: SkillManifestEntry[] = [
  {
    id: 'photography',
    name: '摄影写实',
    filename: 'photography.md',
    description: '强调真实摄影质感：光线、构图、镜头、景深。',
  },
  {
    id: 'illustration',
    name: '插画风格',
    filename: 'illustration.md',
    description: '强调插画化表现：笔触、配色、平面化构图。',
  },
  {
    id: 'cinematic',
    name: '电影质感',
    filename: 'cinematic.md',
    description: '强调电影感画面：调色、景别、叙事氛围。',
  },
]

/** 拼接 skill 内容与用户 prompt 时使用的分隔符 */
export const SKILL_PROMPT_SEPARATOR = '\n\n'

/** 表示未选择任何 skill 的空 id */
export const SKILL_NONE = ''

/** 自定义 skill 的 id 前缀，用于与内置 skill 区分（内置 id 来自清单，不含此前缀） */
export const CUSTOM_SKILL_ID_PREFIX = 'custom-'

/** skill 内容被拼接时包裹在用户输入前的固定引导行 */
export const SKILL_USER_INPUT_LEAD = '用户需求：'

/**
 * 根据 id 从清单中查找条目，找不到返回 null。
 */
export function findSkillById(id: string): SkillManifestEntry | null {
  return SKILL_MANIFEST.find((entry) => entry.id === id) ?? null
}

/**
 * 判断 id 是否为自定义 skill（运行时数据库中维护，而非内置清单）。
 */
export function isCustomSkillId(id: string): boolean {
  return id.startsWith(CUSTOM_SKILL_ID_PREFIX)
}

/**
 * 持久化到 IndexedDB 的自定义 skill 记录。
 * 主键 pk 由 Dexie 自增；skillId 为业务唯一标识，带 CUSTOM_SKILL_ID_PREFIX 前缀。
 */
export interface CustomSkillRecord {
  pk?: number
  skillId: string
  name: string
  description: string
  content: string
  createdAt: number
  updatedAt: number
}

/**
 * UI 下拉与编辑统一使用的 skill 视图。
 * builtin = true 的项只读，不可编辑/删除；builtin = false 的项来自用户自定义。
 */
export interface SkillOption {
  id: string
  name: string
  description: string
  builtin: boolean
}

/** 把内置清单条目转换为只读的 SkillOption。 */
export function builtinSkillOptions(): SkillOption[] {
  return SKILL_MANIFEST.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    builtin: true,
  }))
}
