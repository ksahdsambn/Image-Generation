# 文件洞察

## 文档与跟踪
- `doc/requirements.md`：产品需求文档，定义独立静态生图站的功能、存储、安全、UI、API 和测试边界。
- `doc/tech-stack.md`：技术栈约束文档，规定 Vue 3、Vite、TypeScript、TailwindCSS、Pinia、Dexie.js、Fetch API、lucide、Vitest、Vue Test Utils、Playwright，并明确禁止 Axios、大型 UI 库、后端框架和对象存储 SDK。
- `doc/implementation-plan.md`：实施计划文档，按阶段描述从项目初始化到最终验收的开发步骤和验证测试。
- `doc/task-checklist.md`：唯一执行入口，按编号列出必须顺序完成的任务、完成标准、必做测试和失败回退检查。
- `doc/ai-dev-prompt.md`：AI 执行纪律文档，规定执行顺序、质量门槛、测试纪律、失败处理和交付口径。
- `progress.md`：开发进度记录，按阶段记录完成内容、测试结果、放行状态和操作 AI 模型。
- `architecture.md`：文件洞察记录，持续记录项目中每个文件的职责。

## 项目根文件
- `.gitignore`：版本控制忽略规则，排除 `node_modules/`、`dist/`、环境文件和日志。
- `.env.example`：环境变量示例，列出 Sub2API Base URL、站点标题、历史限制和记住密钥开关。
- `package.json`：项目依赖与脚本定义，当前包含 Vue/Vite/TypeScript/Tailwind 基础依赖和开发、类型检查、构建、预览命令。
- `package-lock.json`：npm 锁文件，固定已安装依赖解析结果。
- `index.html`：Vite 静态入口 HTML，挂载 Vue 应用到 `#app`。
- `vite.config.ts`：Vite 配置，启用 Vue 插件、TailwindCSS 插件和 `@` 路径别名。
- `tsconfig.json`：TypeScript 项目引用入口，拆分应用与 Node 配置。
- `tsconfig.app.json`：浏览器端 Vue/TypeScript 编译配置，包含 `@/*` 路径映射。
- `tsconfig.node.json`：Vite 配置文件的 TypeScript 编译配置。
- `vitest.config.ts`：Vitest 配置，启用 Vue 插件、jsdom 测试环境、`@` 别名和单元/组件测试匹配规则。
- `playwright.config.ts`：Playwright Test 配置，定义端到端测试目录、基础地址和失败 trace 策略。

## 源码文件
- `src/main.ts`：Vue 应用启动入口，通过配置读取层设置页面标题并挂载根组件。
- `src/App.vue`：当前最小工作台页面，占位呈现顶部配置区、参数区、结果区和本地历史区，并在配置缺失时展示错误提示。
- `src/config/appConfig.ts`：集中配置读取层，负责环境变量读取、Sub2API Base URL 校验与规范化、历史限制默认值和记住密钥开关解析。
- `src/errors/appError.ts`：全局错误分类模型，负责把 HTTP 状态、浏览器网络异常和本地存储失败映射为安全的用户可读提示。
- `src/components/ErrorAlert.vue`：通用错误提示组件，以可访问 `alert` 区域展示错误标题和文案。
- `src/components/ApiKeyPanel.vue`：API Key 管理组件，提供密钥输入、显示/隐藏、清除、记住密钥和本地保存风险提示。
- `src/stores/apiKeyStore.ts`：Pinia API Key 状态模块，集中管理密钥内存状态、sessionStorage 默认保存、localStorage 可选记住和清除逻辑。
- `src/types/history.ts`：本地历史记录类型定义，明确历史元数据不包含 API Key、Authorization 或账号信息。
- `src/styles/main.css`：全局样式入口，引入 TailwindCSS，并设置基础字体、背景和盒模型。
- `src/pages/.gitkeep`：保留页面目录，后续放置页面级组件。
- `src/components/.gitkeep`：保留组件目录，后续放置可复用 UI 组件。
- `src/stores/.gitkeep`：保留状态目录，后续放置 Pinia 状态模块。
- `src/services/.gitkeep`：保留服务目录，后续放置 Sub2API 请求服务。
- `src/storage/.gitkeep`：保留本地存储目录，后续放置 IndexedDB/Dexie 逻辑。
- `src/types/.gitkeep`：保留类型目录，后续放置共享 TypeScript 类型。
- `src/utils/.gitkeep`：保留工具目录，后续放置通用函数。
- `tests/.gitkeep`：保留测试目录，后续放置单元、组件和浏览器测试。
- `tests/unit/smoke.test.ts`：单元测试框架 smoke 测试，确认 Vitest 可运行。
- `tests/unit/appConfig.test.ts`：配置读取单元测试，覆盖 Base URL 缺失/非法/规范化、历史限制默认值和全部配置读取。
- `tests/unit/appError.test.ts`：错误分类单元测试，覆盖 HTTP 状态映射、CORS/网络异常、本地存储失败提示和密钥脱敏。
- `tests/unit/apiKeyStore.test.ts`：API Key 状态单元测试，覆盖设置、默认会话保存、记住密钥恢复、关闭记住清理和一键清除。
- `tests/unit/historyRecord.test.ts`：历史记录类型边界测试，确认序列化历史元数据不包含 API Key、Authorization 或 Bearer 信息。
- `tests/component/App.test.ts`：组件测试 smoke 测试，确认 Vue Test Utils 可挂载根工作台区域。
- `tests/component/config-ui.test.ts`：配置 UI 组件测试，确认 Base URL 缺失提示可见且页面没有 Base URL 输入项。
- `tests/component/ErrorAlert.test.ts`：错误提示组件测试，确认错误文案在可见 `alert` 区域渲染。
- `tests/component/ApiKeyPanel.test.ts`：API Key 管理组件测试，覆盖输入、显示/隐藏、清除和记住密钥风险提示。
- `tests/e2e/smoke.spec.ts`：Playwright Test smoke 测试，确认端到端测试运行器可启动。

## 生成目录
- `node_modules/`：npm 安装的本地依赖目录，不属于源代码。
- `dist/`：生产构建产物目录，由 `npm run build` 生成，不属于源代码。

## 第 6 阶段新增与更新文件
- `src/types/generation.ts`：生成参数领域类型与常量，定义固定模型 `gpt-image-2`、固定响应格式 `b64_json`、尺寸/质量/背景/输出格式可选值、数量与文件大小限制、参数默认值、URL 校验、文件输入建模和提交前规范化校验。
- `src/stores/generationParamsStore.ts`：Pinia 生成参数状态模块，集中管理 Prompt、尺寸、数量、质量、背景、输出格式、压缩比例、本地参考图、网页图片 URL、mask 文件和 mask URL，并提供重置与规范化参数 getter。
- `src/components/GenerationParamsPanel.vue`：生成参数表单组件，负责渲染 Prompt、受控选项、压缩滑块、参考图/URL/mask 输入、Generate 提交和 Reset 重置，不直接发起网络请求。
- `tests/unit/generationParamsStore.test.ts`：生成参数 store 单元测试，覆盖默认状态、参数更新、固定模型/响应格式、空 Prompt 阻止提交、非法尺寸/数量约束、输出格式与压缩联动、参考图与 URL 冲突、重置行为。
- `tests/component/GenerationParamsPanel.test.ts`：生成参数组件测试，覆盖空 Prompt 禁止提交、有效 Prompt 提交规范化参数、PNG 禁用压缩、参数重置。
- `src/App.vue`：工作台壳层更新，参数占位区替换为 `GenerationParamsPanel`，结果区和本地历史区仍为后续阶段占位。
- `tests/component/App.test.ts`：更新工作台壳层断言，覆盖参数、当前结果和本地历史区域渲染。
- `tests/component/config-ui.test.ts`：更新配置错误标题断言，继续确认页面不提供 Base URL 输入。

## 第 7 阶段新增文件
- `src/services/imageApi.ts`：Sub2API 图片请求服务层，统一封装文生图 `/v1/images/generations`、本地参考图 multipart `/v1/images/edits`、网页图片 URL JSON `/v1/images/edits`、输入模式决策、Fetch 错误分类和 `b64_json` 响应解析。该文件是当前唯一允许发起图片 API `fetch` 的模块。
- `tests/unit/imageApi.test.ts`：Sub2API 请求层单元测试，使用模拟 Fetch 验证文生图 JSON 请求、multipart 改图请求、URL 改图请求、固定 `gpt-image-2`、固定 `b64_json`、错误分类、输入模式决策、非法 URL 阻止请求和多图响应解析。
