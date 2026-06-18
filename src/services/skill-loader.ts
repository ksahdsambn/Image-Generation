import { createNetworkError } from '@/types/errors'
import { findSkillById, type SkillManifestEntry } from '@/types/skill'

/**
 * 从 public/skills/ 加载 skill 文件内容并做内存缓存。
 *
 * public/ 目录会被 Vite 原样拷贝到构建产物根目录，
 * 因此运行时用相对路径 `/skills/<filename>` 即可 fetch 到。
 *
 * 缓存键为 filename，避免切换 skill 时重复请求。
 */

const cache = new Map<string, string>()

/** 构造 skill 文件的访问 URL，使用相对根路径，跟随站点部署位置。 */
function buildSkillUrl(filename: string): string {
  return `${import.meta.env.BASE_URL}skills/${filename}`
}

/**
 * 读取指定 skill 文件的纯文本内容，命中缓存时直接返回。
 * 加载失败（网络错误或非 2xx）抛出 AppError。
 *
 * @param id skill id（见 SKILL_MANIFEST）
 * @param fetchFn 可选的自定义 fetch，便于测试注入
 */
export async function loadSkillContent(
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ entry: SkillManifestEntry; content: string }> {
  const entry = findSkillById(id)
  if (!entry) {
    throw createNetworkError(new Error(`未知的 skill id: ${id}`))
  }

  const cached = cache.get(entry.filename)
  if (cached !== undefined) {
    return { entry, content: cached }
  }

  const url = buildSkillUrl(entry.filename)
  let response: Response
  try {
    response = await fetchFn(url)
  } catch (err) {
    throw createNetworkError(err instanceof Error ? err : new Error(String(err)))
  }

  if (!response.ok) {
    throw createNetworkError(new Error(`加载 skill 文件失败：HTTP ${response.status} ${url}`))
  }

  const content = (await response.text()).trim()
  if (!content) {
    throw createNetworkError(new Error(`skill 文件内容为空：${url}`))
  }

  cache.set(entry.filename, content)
  return { entry, content }
}

/** 清空内存缓存（主要供测试使用）。 */
export function clearSkillCache(): void {
  cache.clear()
}
