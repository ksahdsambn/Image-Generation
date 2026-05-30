# 开发进度

## 2026-05-29

### 0. 准备阶段
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 按 `ai-dev-prompt.md` 要求读取 `requirements.md`、`tech-stack.md`、`implementation-plan.md`、`task-checklist.md`、`ai-dev-prompt.md`。
  - 确认项目边界：独立静态前端站，固定 Sub2API 后端，仅支持 `gpt-image-2`，图片仅保存到浏览器 IndexedDB。
  - 确认不实现用户系统、服务端数据库、服务端图库、对象存储、分享链接和后端代理。
  - 检查当前项目结构，当前仅存在 `doc/` 文档目录，尚无越界实现。
  - 检查运行环境：Node.js v24.12.0、npm 11.6.2、Git 2.52.0.windows.1 可用。
- 测试结果：
  - 文档逐项打开成功，内容与项目目标一致。
  - 环境版本检查通过。
  - 边界检查通过，未发现 server、api backend、server database、S3/OSS 或 storage server 实现结构。
- 是否放行：是，允许进入 1. 项目初始化。

### 1. 项目初始化
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 建立 Vue 3 + Vite + TypeScript 静态前端骨架。
  - 配置 TailwindCSS 全局样式与 Vite 插件。
  - 配置 `@` 到 `src` 的路径别名。
  - 建立 `src/pages`、`src/components`、`src/stores`、`src/services`、`src/storage`、`src/types`、`src/utils`、`tests` 基础目录。
  - 清理默认脚手架示例内容，首页为最小生图工作台占位布局。
  - 设置应用标题从 `VITE_APP_TITLE` 读取，默认 `GPT Image 2 生图站`。
  - 增加 `.gitignore`，排除依赖、构建产物、环境文件和日志。
- 测试结果：
  - `npm install` 通过，0 vulnerabilities。
  - `npm run typecheck` 通过。
  - `npm run build` 通过，生成纯静态 `dist/` 产物。
  - 本地开发服务 `http://127.0.0.1:5173/` 返回 200。
  - Tailwind 构建产物包含预期样式。
  - 源码内搜索 `HelloWorld`、`Vue logo`、`create-vue`、`vite.svg`、`logo.svg` 无残留。
  - 未新增服务端入口、API 路由、服务端数据库配置或对象存储配置。
- 是否放行：是，允许进入 2. 依赖与约束。

### 2. 依赖与约束
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 安装推荐运行依赖：Pinia、Dexie.js、VueUse、lucide-vue-next。
  - 安装测试依赖：Vitest、Vue Test Utils、Playwright Test、jsdom。
  - 配置 Vitest 单元/组件测试入口。
  - 配置 Playwright smoke 测试入口。
  - 增加 `test`、`test:unit`、`test:component`、`test:e2e` 脚本。
- 测试结果：
  - `npm audit --audit-level=high`：0 vulnerabilities。
  - 推荐依赖检查：无缺失。
  - 禁止依赖检查：未发现 Axios、Element Plus、Ant Design Vue、Nuxt、Next.js、Express、Koa、S3/OSS SDK。
  - `npm run test:unit`：1 个测试通过。
  - `npm run test:component`：1 个测试通过。
  - `npm run test:e2e`：1 个测试通过。
  - `npm test`：2 个 Vitest 测试通过。
  - `npm run build`：通过。
  - 注意：`lucide-vue-next` 安装时提示包已弃用，但它是当前文档指定依赖；未引入替代大型 UI 库。
- 是否放行：是，允许进入 3. 配置系统。

### 3. 配置系统
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增集中配置读取层 `src/config/appConfig.ts`。
  - 支持读取 `VITE_SUB2API_BASE_URL`、`VITE_APP_TITLE`、`VITE_HISTORY_MAX_ITEMS`、`VITE_HISTORY_MAX_BYTES`、`VITE_REMEMBER_KEY_ENABLED`。
  - 实现 Sub2API Base URL 必填、http/https 校验和末尾斜杠规范化。
  - 实现历史最大数量默认 50、最大容量默认 500MB，非法值回退默认。
  - 页面在 Base URL 缺失时显示明确配置错误。
  - 新增 `.env.example` 说明构建环境变量。
  - 页面不提供 Base URL 输入框。
- 测试结果：
  - `npm run test:unit`：2 个测试文件、7 个测试通过。
  - `npm run test:component`：2 个测试文件、3 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - 使用 `VITE_SUB2API_BASE_URL=https://configured-sub2api.example.com/` 和 `VITE_APP_TITLE=阶段配置标题` 重新构建，产物包含新标题和配置地址。
  - `src`、`tests`、`index.html` 中检查未发现页面级 Base URL 输入实现。
- 是否放行：是，允许进入 4. 错误处理。

### 4. 错误处理
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增全局错误分类模型 `src/errors/appError.ts`。
  - 覆盖认证、图片权限、余额/额度、限流、CORS、网络、上游、本地存储、校验和未知错误。
  - 实现固定中文用户提示，不透传原始请求头、密钥或敏感响应。
  - 新增 `ErrorAlert` 可见错误提示组件。
  - 配置错误提示改用统一错误提示组件展示。
- 测试结果：
  - `npm run test:unit`：3 个测试文件、17 个测试通过。
  - `npm run test:component`：3 个测试文件、4 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
  - 单元测试覆盖常见 HTTP 状态、CORS/预检异常、网络异常、IndexedDB 写入失败提示和 API Key 脱敏。
  - 组件测试确认错误提示在 `role="alert"` 可见区域展示。
- 是否放行：是，允许进入 5. API Key 管理。

### 5. API Key 管理
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 Pinia 状态模块 `src/stores/apiKeyStore.ts`，集中管理 API Key、记住密钥和显示/隐藏状态。
  - 默认将 API Key 保存到 `sessionStorage`。
  - 用户主动开启“记住密钥”时才保存到 `localStorage`。
  - 关闭“记住密钥”会清理 `localStorage` 中的密钥并保留当前会话密钥。
  - 一键清除会同时清空内存、`sessionStorage` 和 `localStorage` 相关密钥。
  - 新增 `ApiKeyPanel` 组件，支持输入、显示/隐藏、清除、记住密钥和风险提示。
  - 新增图库记录类型 `ImageHistoryRecord`，模型固定 `gpt-image-2`，不包含 API Key 字段。
  - `main.ts` 接入 Pinia。
- 测试结果：
  - 首次 `npm run test:component` 失败，原因是 `App` 组件测试未挂载 Pinia；已修复测试挂载配置并重测。
  - 第二次 `npm run test:component` 失败，原因是 Base URL 输入断言误把 `Sub2API API Key` 识别为 Base URL；已收紧断言并重测。
  - `npm run test:unit`：5 个测试文件、23 个测试通过。
  - `npm run test:component`：4 个测试文件、8 个测试通过。
  - `npm test`：9 个测试文件、31 个测试通过。
  - `npm run build`：通过。
  - 日志/临时文件检查：无阶段遗留日志。
  - Git 状态检查：当前目录不是 Git 仓库。
- 是否放行：是，用户指定的 0 到 5 阶段已完成；未进入 6. 生成参数管理。

### 6. 生成参数管理
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `src/types/generation.ts`，集中定义 `gpt-image-2`、`b64_json`、尺寸、数量、质量、背景、输出格式、压缩比例、参考图、网页图片 URL 和 mask 的参数类型与校验规则。
  - 新增 `src/stores/generationParamsStore.ts`，使用 Pinia 集中管理 Prompt、尺寸、数量、质量、背景、输出格式、压缩比例、本地参考图、网页图片 URL 和遮罩状态。
  - 新增 `src/components/GenerationParamsPanel.vue`，替换参数占位区，提供 Prompt、受控参数、参考图、URL、mask、提交和重置入口。
  - 实现 Prompt 去首尾空白、空 Prompt 阻止提交、尺寸固定选项、数量 1-4 约束、输出格式与压缩参数联动、参数重置。
  - 规范化参数始终注入 `model: "gpt-image-2"` 与 `response_format: "b64_json"`，不提供页面模型选择器。
  - 新增 `tests/unit/generationParamsStore.test.ts` 和 `tests/component/GenerationParamsPanel.test.ts` 覆盖第 6 阶段必测行为。
- 测试结果：
  - `npm run test:unit -- generationParamsStore`：通过，6 个测试文件，30 个测试通过。
  - `npm run test:component -- GenerationParamsPanel`：通过，5 个测试文件，12 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，6 个测试文件，30 个测试通过。
  - `npm run test:component`：通过，5 个测试文件，12 个测试通过。
  - `npm run build`：通过。
- 失败回退检查：
  - 未新增可编辑模型选择器。
  - 未新增页面级 Base URL 输入。
  - 未接入网络请求，未发送 API Key。
  - 参数重置不涉及 API Key 或历史记录。
- 是否放行：是，允许进入 7. Sub2API 请求层。

### 7. Sub2API 请求层
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `src/services/imageApi.ts`，统一封装所有图片请求入口，组件不直接拼接请求或调用 `fetch`。
  - 实现文生图 JSON 请求：`POST {baseUrl}/v1/images/generations`，携带 `Authorization: Bearer <api_key>`、`Content-Type: application/json`、固定 `model: "gpt-image-2"` 与 `response_format: "b64_json"`。
  - 实现本地参考图 multipart 改图请求：`POST {baseUrl}/v1/images/edits`，使用 `FormData` 附加 model、prompt、参数、重复 `image` 字段和可选 `mask`，不手动设置 multipart `Content-Type`。
  - 实现网页图片 URL 改图请求：`POST {baseUrl}/v1/images/edits`，JSON body 使用 `images: [{ image_url }]` 和可选 `mask.image_url`。
  - 实现输入模式决策：无参考图走文生图，本地参考图走 multipart edits，仅 URL 走 JSON edits，本地参考图与 URL 混用会阻止提交。
  - 实现响应解析：解析一张或多张 `b64_json`，保留可选 `revised_prompt`，异常响应走全局错误分类。
  - 新增 `tests/unit/imageApi.test.ts` 覆盖请求 URL、Header、Body、FormData、错误分类、输入模式和响应解析。
- 测试结果：
  - `npm run test:unit -- imageApi`：通过，7 个测试文件，38 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，7 个测试文件，38 个测试通过。
  - `npm run test:component`：通过，5 个测试文件，12 个测试通过。
  - `npm run build`：通过。
  - `npm run test:e2e`：通过，1 个 Playwright smoke 测试通过。
  - `rg "fetch\\(" src tests -g "!src/services/imageApi.ts"`：无匹配，确认组件和其他模块未直接绕过请求层。
- 失败回退检查：
  - 未引入 Axios 或后端代理。
  - API Key 只作为 Authorization 请求头传给配置的 Sub2API Base URL。
  - multipart 请求未手动设置 `Content-Type` 边界。
  - 错误提示沿用全局分类，不暴露 Authorization 或 API Key。
  - 未输出完整 base64 到日志。
- 是否放行：是，7. Sub2API 请求层完成。

### 8. 图片转换与下载
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `src/utils/imageResult.ts`，实现 `b64_json` 到 `Blob` 的转换、PNG/WebP/JPEG MIME 推断、扩展名映射、当前结果对象 URL 创建与释放、单图下载、批量下载辅助、剪贴板复制图片或 Data URL 降级。
  - 新增 `src/components/CurrentResultsPanel.vue`，实现当前结果空状态、加载状态、错误状态、多图网格预览、单图下载、批量下载、复制、移除当前结果，并在图片变化和组件销毁时释放对象 URL。
  - 更新 `src/App.vue`，用当前结果面板替换占位结果区；当前结果移除只影响当前预览，不删除未来 IndexedDB 历史。
  - 新增 `tests/unit/imageResult.test.ts`，覆盖 base64 转 Blob、MIME 推断、MIME fallback、多图转换、`revised_prompt` 保留、对象 URL 创建与释放。
  - 新增 `tests/component/CurrentResultsPanel.test.ts`，覆盖空状态、预览 URL 创建、URL 释放、移除事件、单图/批量下载、剪贴板复制成功与失败提示。
- 测试结果：
  - `npm run test:unit -- imageResult`：通过，8 个测试文件、43 个测试通过。
  - `npm run test:component -- CurrentResultsPanel`：通过，6 个测试文件、18 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，8 个测试文件、43 个测试通过。
  - `npm run test:component`：通过，6 个测试文件、18 个测试通过。
  - `npm run build`：通过。
- 失败回退检查：
  - 未输出完整 base64 到控制台。
  - 下载文件扩展名与推断 MIME 保持一致。
  - 当前结果对象 URL 在结果变化和组件卸载时释放。
  - 未引入后端、对象存储、Axios 或大型 UI 库。
- 是否放行：是，允许进入 9. IndexedDB 本地图库。

### 9. IndexedDB 本地图库
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增测试依赖 `fake-indexeddb`，仅用于 Vitest 中隔离模拟浏览器 IndexedDB；运行时代码仍使用 Dexie 和浏览器原生 IndexedDB。
  - 扩展 `src/types/history.ts`，定义历史完整记录、列表记录、持久化 Blob 结构、查询条件和容量限制类型。
  - 新增 `src/storage/historyDb.ts`，建立 Dexie 数据库 `gpt-image-2-local-gallery`，版本为 1，按 `history` 元数据/缩略图表与 `images` 大图表分离存储，避免历史列表一次性读取大图。
  - 实现历史写入、生成结果批量写入、缩略图生成、单条读取、倒序分页、Prompt 搜索、日期筛选、单条删除、清空、数量清理、容量清理和 IndexedDB 可用性检测。
  - 内部持久化 Blob 使用 `{ type, data }` 字节结构，业务层读写边界仍返回 `Blob`，避免测试环境结构化克隆差异。
  - 新增 `src/components/LocalHistoryPanel.vue`，提供历史不可用降级提示、空状态、搜索/日期输入和基础历史操作事件；完整主界面接线留给 10 阶段。
  - 更新 `src/App.vue`，用 `LocalHistoryPanel` 替换历史占位区，当前仍传入空列表。
  - 新增 `tests/unit/historyDb.test.ts` 与 `tests/component/LocalHistoryPanel.test.ts`，覆盖 IndexedDB 初始化、读写、敏感信息排除、缩略图、分页、搜索、日期筛选、恢复参数数据、删除、清空、数量/容量清理和降级提示。
- 测试结果：
  - 首次 `npm run test:unit -- historyDb` 失败：测试环境未在 Dexie 初始化前挂载 IndexedDB；已通过 `fake-indexeddb/auto` 修复并重测。
  - 第二次 `npm run test:unit -- historyDb` 失败：`fake-indexeddb` 在 jsdom 下不能稳定结构化克隆 `Blob`；已改为内部持久化字节结构并重测。
  - `npm run test:unit -- historyDb`：通过，9 个测试文件、54 个测试通过。
  - `npm run test:component -- LocalHistoryPanel`：通过，7 个测试文件、22 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，9 个测试文件、54 个测试通过。
  - `npm run test:component`：通过，7 个测试文件、22 个测试通过。
  - `npm run build`：通过。
- 失败回退检查：
  - 历史记录未保存 API Key、Authorization、Bearer 或用户身份信息。
  - 历史列表只读取元数据和缩略图，不读取大图 Blob。
  - 清空历史不影响 API Key/sessionStorage。
  - 超过数量或容量限制时删除最旧记录并保留最新记录。
  - IndexedDB 不可用时提供降级提示，当前结果下载能力不依赖历史。
  - 未引入后端、对象存储、Axios 或大型 UI 库。
- 是否放行：是，允许进入 10. 主界面。

### 10. 主界面
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 更新 `GenerationParamsPanel`，新增 `canGenerate` 与 `isGenerating` 控制，缺少 API Key、配置无效、Prompt 无效或生成中时禁用 Generate，并显示 loading 文案。
  - 为本地参考图和遮罩图增加缩略图预览与对象 URL 生命周期释放；非图片或超限文件会被拒绝并显示提示。
  - 增强 `GenerationParamsPanel` 测试，覆盖 API Key 缺失禁用、loading 禁用、参考图上传/预览/移除、非图片拒绝、URL 校验、遮罩图和遮罩 URL 输入。
  - 更新 `App.vue` 工作台接线：顶部 API Key 区、参数表单、当前结果区、本地历史区四区齐备；历史区接入 IndexedDB 可用性检测、搜索、日期筛选、重新载入参数、下载、删除和清空操作。
  - `LocalHistoryPanel` 已提供历史不可用、空状态、历史列表、搜索、日期筛选和基础操作；`CurrentResultsPanel` 已提供空、加载、错误和成功状态。
  - 增强 `App` 测试，确认工作台区域存在、无 API Key 时无法提交、API Key 不在输入框外泄露。
- 测试结果：
  - 首次 `npm run test:component -- GenerationParamsPanel App LocalHistoryPanel CurrentResultsPanel ApiKeyPanel` 失败：文件 input 测试使用了错误的 `setValue` 写法，且 URL 校验被空 Prompt 首个错误覆盖；已修正为模拟 `files` 并补 Prompt 后重测。
  - `npm run test:component -- GenerationParamsPanel App LocalHistoryPanel CurrentResultsPanel ApiKeyPanel`：通过，9 个测试文件、45 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，9 个测试文件、54 个测试通过。
  - `npm run test:component`：通过，7 个测试文件、29 个测试通过。
  - `npm run build`：通过。
  - `npm run test:e2e`：通过，1 个 Playwright smoke 测试通过。
- 失败回退检查：
  - 首页仍是生图工作台，没有营销落地页。
  - 页面没有可编辑模型选择器，没有 Base URL 输入框。
  - API Key 不在输入框外显示，不进入历史 UI。
  - 图标按钮均有 `aria-label` 或明确文本。
  - 参考图和遮罩图对象 URL 会在变化或卸载时释放。
  - 未引入后端、对象存储、Axios 或大型 UI 库。
- 是否放行：是，允许进入 11. 流程集成。

### 11. 流程集成
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `src/services/generationWorkflow.ts`，把 API 请求、`b64_json` 图片转换、当前结果返回、历史写入和历史写入失败降级封装为可测试流程。
  - 更新 `src/App.vue`，接入 `GenerationParamsPanel` submit 事件，使用 `createImageApiClient` 发起请求，成功后写入当前结果区并保存到 IndexedDB 历史；请求失败时显示错误且不写历史；历史写入失败时保留当前结果并提示用户下载。
  - 文生图、multipart 本地参考图改图、URL 改图和 mask URL 均通过现有请求层决策进入正确接口。
  - 更新 `createThumbnailBlob`，在测试或受限浏览器环境缺少 `createImageBitmap` 时降级使用原图 Blob，保证当前结果和历史写入链路不崩溃。
  - 新增 `tests/unit/generationWorkflow.test.ts`，覆盖成功写历史、API 失败不写历史、历史写入失败不丢当前结果。
  - 新增 `tests/component/AppWorkflow.test.ts`，使用模拟 Fetch 和隔离 IndexedDB 验证文生图完整流程、本地参考图 multipart edits、URL edits + mask URL、无 API Key 不发请求、API 失败不写历史。
  - 使用 Browser 插件打开 `http://127.0.0.1:5173/` 做真实渲染检查，确认工作台区域、API Key 区、参数表单、当前结果和本地历史区域可见，Generate 在缺少 Prompt/API Key 时禁用。
- 测试结果：
  - 首次 `npm run test:component -- AppWorkflow App GenerationParamsPanel CurrentResultsPanel LocalHistoryPanel` 失败：测试中共享 Dexie 实例被关闭导致后续用例数据库关闭，且当前结果断言等待不足；已修正测试生命周期和异步等待。
  - 第二次同命令失败：认证失败提示断言等待不足；已补充等待后重测。
  - `npm run test:unit -- generationWorkflow imageApi historyDb imageResult`：通过，10 个测试文件、57 个测试通过。
  - `npm run test:component -- AppWorkflow App GenerationParamsPanel CurrentResultsPanel LocalHistoryPanel`：通过，10 个测试文件、50 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run test:unit`：通过，10 个测试文件、57 个测试通过。
  - `npm run test:component`：通过，8 个测试文件、34 个测试通过。
  - `npm run build`：通过。
  - `npm run test:e2e`：通过，1 个 Playwright smoke 测试通过。
  - Browser 真实渲染检查：通过，页面在 `http://127.0.0.1:5173/` 可打开，核心工作台区域可见。
- 失败回退检查：
  - API 请求失败不会新增 IndexedDB 历史。
  - IndexedDB 写入失败不会清空当前结果。
  - API Key 只作为 Authorization 发送到配置的 Sub2API Base URL。
  - 请求模型仍固定为 `gpt-image-2`，响应格式仍固定为 `b64_json`。
  - 未新增后端代理、服务端存储、对象存储、Axios 或大型 UI 库。
- 是否放行：是，8. 图片转换与下载、9. IndexedDB 本地图库、10. 主界面、11. 流程集成均已完成并放行。

### 12. 连接检查
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 在 `src/services/imageApi.ts` 新增只读连接检查，使用 `GET /v1/models` 和 `Authorization: Bearer <api_key>`，不调用 `/v1/images/generations` 或 `/v1/images/edits`，不消耗图片额度。
  - 在 `src/components/ApiKeyPanel.vue` 新增“测试连接”按钮、加载状态、成功提示和错误提示。
  - API Key 修改后连接状态自动恢复为未测试，避免旧状态误导用户。
  - `src/App.vue` 将固定构建配置中的 Sub2API Base URL 和配置可用状态传入 API Key 面板，页面仍不提供 Base URL 输入框。
- 测试结果：
  - `npm run test:unit -- imageApi`：通过，10 个测试文件、60 个测试通过；覆盖连接成功、认证失败、CORS 失败、网络失败和只读 endpoint。
  - `npm run test:component -- ApiKeyPanel`：通过，8 个测试文件、37 个测试通过；覆盖连接按钮 loading、成功/失败提示和 API Key 修改后的状态重置。
  - `npm run typecheck`：通过。
- 失败回退检查：
  - 连接测试未触发生图接口，未进入 `/v1/images/generations` 或 `/v1/images/edits`。
  - API Key 仅作为 Authorization 请求头发送到配置的 Sub2API Base URL。
- 是否放行：是，允许进入 13. 安全与隐私。

### 13. 安全与隐私
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `tests/e2e/security.spec.ts`，用 Playwright 拦截浏览器请求，验证携带 Authorization 的请求只发送到配置的 Sub2API Base URL。
  - 验证生成成功后 API Key 不进入 IndexedDB 历史记录，localStorage 不保存密钥、大图、base64 或 data URL；默认密钥仅存在 sessionStorage。
  - 验证失败请求的界面错误和控制台输出不包含 API Key、Authorization 或 Bearer 内容。
  - 更新 `playwright.config.ts`，为 e2e 自动启动本地 Vite dev server，并注入测试用 Sub2API Base URL。
- 测试结果：
  - 首次 `npm run test:e2e -- security.spec.ts` 失败，原因是本机缺少 Playwright Chromium，可执行文件未安装；已执行 `npx playwright install chromium` 修复环境。
  - 重跑 `npm run test:e2e -- security.spec.ts`：通过，2 个 e2e 测试通过。
  - `npm run build`：通过。
  - `npm run test:unit -- historyRecord historyDb appError imageResult`：通过，10 个测试文件、60 个测试通过。
  - 敏感密钥正则扫描：通过，源码、测试和构建产物未发现真实 API Key 形态。
  - `console.` 扫描：通过，`src` 和 `tests` 中未发现控制台输出。
  - localStorage/base64 扫描：通过，localStorage 写入仅在 API Key store 中，base64 仅存在图片转换逻辑和固定响应格式定义中。
  - Authorization/Bearer 扫描：通过，仅存在请求头构建逻辑及构建后对应代码，未发现硬编码密钥。
- 失败回退检查：
  - 未发现真实密钥；无需轮换。
  - API Key 仅作为 Authorization 发送到配置的 Sub2API Base URL。
  - 未发现大图写入 localStorage，也未发现敏感日志输出。
- 是否放行：是，允许进入 14. 响应式与可访问性。

### 14. 响应式与可访问性
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 按 `adapt` 技能检查桌面、平板和手机视口，新增 `tests/e2e/responsive.spec.ts`。
  - Playwright 在 1440x1000 桌面、820x1180 平板、390x844 手机视口生成截图并检查无横向溢出。
  - 手机视口验证完整核心流程：输入 API Key、填写 Prompt、模拟生成、查看历史、触发下载。
  - 新增按钮可访问名称检查，确保图标按钮具备文本、`aria-label` 或 `title`。
  - 修复 `src/storage/historyDb.ts` 中缩略图解码失败会导致历史写入失败的问题：`createImageBitmap` 失败时降级使用原图 Blob，保证当前结果和历史写入链路稳定。
- 测试结果：
  - 首次 `npm run test:e2e -- responsive.spec.ts` 失败：移动端生成后历史为空，原因是测试图像无法解码缩略图导致 IndexedDB 写入失败。
  - 替换测试图片为合法 1x1 PNG，并增加缩略图解码失败降级后，重跑 `npm run test:e2e -- responsive.spec.ts`：通过，3 个 e2e 测试通过。
  - `npm run test:unit -- historyDb`：通过，10 个测试文件、61 个测试通过。
  - `npm run typecheck`：通过。
- 失败回退检查：
  - 桌面、平板、手机视口均无横向溢出。
  - 手机端核心流程可完成，结果可预览，历史可见，下载可触发。
  - 未发现无可访问名称按钮。
- 是否放行：是，允许进入 15. 自动化测试。

### 15. 自动化测试
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 新增 `tests/e2e/workflow.spec.ts`，覆盖无 API Key 禁止提交、错误 API Key 显示认证错误且不写历史、成功生成写入历史、刷新后历史恢复、删除历史记录。
  - 将第 13 阶段安全 e2e、第 14 阶段响应式 e2e 与主流程 e2e 一并纳入 Playwright 全套。
  - 确认配置、API Key 状态、生成参数、请求构建、图片转换、IndexedDB、组件和浏览器主流程均有自动化覆盖。
- 测试结果：
  - `npm run test:unit -- appConfig apiKeyStore generationParamsStore`：通过。
  - `npm run test:unit -- imageApi`：通过。
  - `npm run test:unit -- imageResult`：通过。
  - `npm run test:unit -- historyDb`：通过。
  - `npm run test:component`：通过，8 个测试文件、37 个测试通过。
  - `npm run test:e2e`：通过，10 个 Playwright 测试通过。
  - `npm run test:unit`：通过，10 个测试文件、61 个测试通过。
  - `npm run typecheck`：通过。
  - `npm run build`：通过。
- 失败回退检查：
  - 组件测试使用模拟请求和隔离本地存储，不访问真实网络。
  - Playwright 测试使用拦截的模拟 Sub2API 响应，不使用真实生产 API Key。
  - 所有请求层测试继续确认固定 `gpt-image-2` 和 `b64_json`。
- 是否放行：是，允许进入 16. 真实 Sub2API 联调。

### 16. 真实 Sub2API 联调
- 操作 AI 模型：GPT-5 Codex
- 完成内容：
  - 按阶段顺序进入真实联调前置检查。
  - 检查本地运行期配置文件是否存在：`.env`、`.env.local`、`.env.development`、`.env.production` 均不存在。
  - 检查环境变量是否存在：`VITE_SUB2API_BASE_URL`、`SUB2API_TEST_API_KEY`、`VITE_SUB2API_TEST_API_KEY` 均不存在。
  - 未读取、输出或写入任何真实 API Key。
- 测试结果：
  - 16.1 Sub2API CORS 浏览器真实请求测试：未执行，原因是缺少真实 `VITE_SUB2API_BASE_URL`，无法确定待联调后端和允许来源。
  - 16.2 测试 API Key 认证测试：未执行，原因是缺少可用测试 API Key，且不得把真实密钥写入代码、测试或文档。
  - 16.3 真实文生图、16.4 真实本地参考图改图、16.5 真实网页图片 URL 改图、16.6 联调后密钥处理：未执行，原因是 16.1/16.2 前置条件未通过。
- 失败回退检查：
  - 未使用模拟请求冒充真实联调。
  - 未把真实或疑似真实 API Key 写入项目文件。
  - 未进入后续阶段。
- 是否放行：否。第 16 阶段阻塞在外部配置缺失，需要提供真实 Sub2API Base URL、已配置 CORS 的站点来源，以及仅用于联调的测试 API Key 后才能继续。
