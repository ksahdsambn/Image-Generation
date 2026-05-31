# 修复记录

## 2026-05-31 Bug 审查 Findings 修复

- 操作模型ID: GPT-5 Codex
- 范围: 按代码审查 Findings 修复安全、请求、存储、校验和测试问题；未部署。
- 修复内容:
  - `src/services/image-api.ts`: 三类图片请求在 HTTP 200 body 含 `error` 时一律按失败处理；错误分类显式传入当前 API Key 做脱敏。
  - `src/services/connection-test.ts`: 连接测试同样识别 HTTP 200 body 含 `error`，并对 HTTP/网络错误显式脱敏当前 API Key。
  - `src/types/errors.ts`: 扩展脱敏逻辑，支持显式 secret、`sk-` 下划线/连字符格式、Bearer Token 和 key/token/secret/password 字段。
  - `src/stores/api-key.ts`: `VITE_REMEMBER_KEY_ENABLED=false` 时不恢复旧 localStorage API Key、不写入 localStorage，并清理旧 remember 偏好。
  - `src/stores/generation.ts`: 阻断无遮罩参考图、local 图搭配 mask URL、URL 图搭配本地 mask 文件等来源混用冲突；未知异常 debugHint 显式脱敏当前 API Key。
  - `src/components/HistoryPanel.vue`: 修复历史大图预览每次渲染创建 object URL 且不释放的问题，关闭弹窗、刷新历史和卸载组件时释放 URL。
  - `e2e/app.spec.ts`: Sub2API origin 断言改为从环境配置读取；测试 API Key 改为非 `sk-` 示例；新增桌面/平板无水平溢出和主要区域不重叠检查，移动端验证控件可滚动进入视口并可点击。
  - 补充 Vitest 覆盖: HTTP 200 body error、非标准 API Key 脱敏、remember 禁用、mask 来源冲突、连接测试 200 error。
- 验证:
  - `npm.cmd test -- --run`: 26 files / 419 tests passed。
  - `npm.cmd run build`: passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
