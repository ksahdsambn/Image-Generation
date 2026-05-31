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

## 2026-05-31 Bug 审查追加修复

- 操作模型ID: GPT-5 Codex
- 范围: 按代码审查建议修复 API Key 存储泄露、URL 校验、Playwright 产物跟踪和 E2E 误判风险；未推进任务清单，未部署。
- 修复内容:
  - `src/stores/generation.ts`: 在当前结果态和 IndexedDB 历史写入前，对 prompt 与 revisedPrompt 使用当前 API Key 做显式脱敏，避免用户输入或上游 revised_prompt 回显密钥后进入历史、导出或后续展示链路。
  - `src/__tests__/stores/generation.test.ts`: 新增 prompt/revised_prompt 含当前 API Key 时的脱敏回归测试，覆盖 currentResults 与 IndexedDB history。
  - `src/services/image-api.ts`: `validateImageUrl` 新增凭据 URL、localhost、loopback、私网 IPv4、link-local/metadata host、IPv6 localhost/本地地址拒绝逻辑，降低 URL 参考图触发内网访问或凭据外泄风险。
  - `src/__tests__/services/image-api.test.ts`: 新增本地、私网、metadata、IPv6 localhost 与 userinfo URL 的拒绝用例。
  - `playwright.config.ts`: 将通过用例截图从 `on` 改为 `only-on-failure`，避免每次 E2E 把截图产物写入工作区。
  - `.gitignore`: 忽略 `test-results` 与 `playwright-report`。
  - Git 跟踪: 使用 `git rm -r --cached test-results` 将已跟踪的 Playwright 运行产物移出版本控制。
  - `e2e/app.spec.ts`: API Key 安全用例改为捕获所有带 Authorization 的请求，并断言它们全部发往配置的 Sub2API origin，同时覆盖连接测试 `/v1/models` 与图片接口路径。
- 验证:
  - `npm test`: 26 files / 431 tests passed。
  - `npm run build`: passed。
  - `npm run test:e2e`: 16 tests passed。

## 2026-05-31 部署前审查 Findings 修复

- 操作模型ID: GPT-5 Codex
- 范围: 按发布负责人部署前审查 Findings 修复交付文档、部署目标说明和部署后验证入口；未部署，未推进任务清单。
- 已确认部署信息:
  - 正式前端域名: `https://image.uxde.de`
  - 部署平台: Cloudflare Pages
  - Sub2API 后端: `https://uxde.de`
  - Sub2API CORS: `CORS_ALLOWED_ORIGINS=https://image.uxde.de`，`CORS_ALLOW_CREDENTIALS=false`
- 修复内容:
  - `README.md`: 替换 Vite 模板内容，补充项目定位、Cloudflare Pages 构建配置、生产环境变量、Sub2API CORS、运行/测试/构建/预览命令、API Key 存储策略、IndexedDB 本地历史边界和部署后冒烟测试清单。
  - `playwright.config.ts`: 支持 `PLAYWRIGHT_BASE_URL` 覆盖默认本地 `baseURL`；当目标不是本地开发服务时不启动 Playwright 内置 webServer。
  - `scripts/run-e2e.mjs`: 支持设置 `PLAYWRIGHT_BASE_URL=https://image.uxde.de` 后复用 E2E 验证正式站点；未设置时仍自动启动本地 Vite 服务。
- 验证:
  - `npm test`: 26 files / 431 tests passed。
  - `npm run build`: passed。
  - `npm run test:e2e`: 16 tests passed。
  - 构建产物扫描: 未发现真实 API Key、测试 API Key、测试响应或测试图片文件；`Authorization`、`Bearer`、`b64_json` 为运行时请求字段，`localhost` 为 URL 安全校验文本。
- 后续:
  - 部署到 Cloudflare Pages 后执行正式域名冒烟测试和 CORS 验证。
