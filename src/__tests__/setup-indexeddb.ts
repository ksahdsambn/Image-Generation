import 'fake-indexeddb/auto'
import { i18n } from '@/i18n'

// 测试环境统一锁定为简体中文，避免 jsdom 的 navigator.language（通常 en-US）
// 导致全局 i18n 单例检测到非中文，从而让依赖文案的断言不稳定。
i18n.global.locale.value = 'zh-CN'
