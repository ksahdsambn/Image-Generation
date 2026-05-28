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
