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

## 第 12 阶段更新文件
- `src/services/imageApi.ts`：新增只读连接检查入口 `checkConnection()`，固定调用 `GET /v1/models` 验证 Sub2API 后端、CORS 和 API Key 基础可用性；该路径不调用任何图片生成或改图接口。
- `src/components/ApiKeyPanel.vue`：API Key 管理组件新增连接测试按钮、连接检查加载态、成功/失败状态提示，以及 API Key 变化后的连接状态重置逻辑。
- `src/App.vue`：向 API Key 面板传入构建期固定的 Sub2API Base URL 和配置可用状态，用于执行连接测试；仍不暴露页面级 Base URL 输入。
- `tests/unit/imageApi.test.ts`：新增连接检查单元测试，覆盖 `/v1/models` 请求、Authorization 请求头、认证失败、CORS 失败、网络失败，以及不触发生图/改图接口。
- `tests/component/ApiKeyPanel.test.ts`：新增连接检查组件测试，覆盖按钮 loading、连接成功提示、认证失败提示、CORS 失败提示和 API Key 修改后的状态重置。

## 第 13 阶段更新文件
- `playwright.config.ts`：新增 Playwright `webServer` 配置，e2e 运行时自动启动 Vite dev server，并注入 `VITE_SUB2API_BASE_URL=https://sub2api.example.com` 作为测试期固定 Sub2API 地址。
- `tests/e2e/security.spec.ts`：安全与隐私专项浏览器测试，拦截 Sub2API 请求以验证 Authorization 只发送到配置域名，并检查 localStorage、sessionStorage、IndexedDB、页面错误和控制台输出的敏感信息边界。

## 第 14 阶段更新文件
- `tests/e2e/responsive.spec.ts`：响应式与可访问性专项浏览器测试，覆盖桌面、平板和手机视口截图、横向溢出检查、按钮可访问名称检查，以及手机端生成、历史和下载核心流程。
- `src/storage/historyDb.ts`：增强缩略图生成降级逻辑，`createImageBitmap` 解码失败时返回原图 Blob，避免当前结果可见但历史保存失败。
- `tests/unit/historyDb.test.ts`：新增缩略图解码不可用时保留原图 Blob 的单元测试，覆盖浏览器图像解码失败降级路径。

## 第 15 阶段更新文件
- `tests/e2e/workflow.spec.ts`：主流程端到端测试，使用模拟 Sub2API 响应覆盖无密钥禁止提交、认证失败不写历史、成功生成写入历史、刷新后 IndexedDB 历史恢复、删除历史记录。

## 第 8 阶段新增与更新文件
- `src/utils/imageResult.ts`：图片结果工具模块，负责把 Sub2API 返回的 `b64_json` 转换为 `Blob`，根据 PNG/WebP/JPEG 文件签名或输出格式推断 MIME，生成下载文件名，创建和释放预览对象 URL，触发浏览器原生下载，并封装剪贴板复制图片或 Data URL 降级逻辑。
- `src/components/CurrentResultsPanel.vue`：当前结果展示组件，负责渲染生成结果空、加载、错误、成功状态、多图预览网格、单图下载、批量下载、复制、移除当前结果；组件只管理当前预览对象 URL 生命周期，不写入或删除 IndexedDB 历史。
- `tests/unit/imageResult.test.ts`：图片结果工具单元测试，覆盖 base64 到 Blob、MIME 推断、扩展名映射、多图转换、`revised_prompt` 元数据保留、对象 URL 创建和释放。
- `tests/component/CurrentResultsPanel.test.ts`：当前结果组件测试，覆盖空状态、预览 URL、URL 生命周期释放、移除事件、单图/批量下载和剪贴板复制成功/失败提示。
- `src/App.vue`：根工作台更新，结果区由占位内容替换为 `CurrentResultsPanel`，并维护当前结果的最小状态；历史持久化仍留给 IndexedDB 本地图库阶段。

## 第 9 阶段新增与更新文件
- `src/storage/historyDb.ts`：Dexie/IndexedDB 本地图库模块，定义 `gpt-image-2-local-gallery` 数据库和版本 1 schema。模块按 `history` 元数据/缩略图表与 `images` 大图表分离存储，提供可用性检测、历史写入、生成结果批量写入、缩略图生成、单条读取、倒序分页、Prompt 搜索、日期筛选、单条删除、清空、数量/容量自动清理和参数序列化能力。
- `src/types/history.ts`：历史类型定义扩展，增加列表项、持久化 Blob、IndexedDB 元数据记录、大图记录、创建输入、查询条件和容量限制类型。业务层完整记录仍包含 `Blob`，IndexedDB 内部使用可测试的字节结构保存图片数据。
- `src/components/LocalHistoryPanel.vue`：本地历史面板组件，负责展示历史不可用降级提示、历史空状态、搜索输入、日期筛选输入和基础历史操作事件；缩略图对象 URL 在记录变化和组件卸载时释放。
- `tests/unit/historyDb.test.ts`：IndexedDB 本地图库单元测试，使用 `fake-indexeddb` 隔离数据库，覆盖初始化、完整字段读写、敏感信息排除、缩略图写入、倒序分页、搜索、日期筛选、删除、清空、数量/容量清理和不可用降级。
- `tests/component/LocalHistoryPanel.test.ts`：本地历史面板组件测试，覆盖降级提示、历史记录渲染、搜索/筛选/恢复/下载/删除/清空事件，以及缩略图对象 URL 生命周期。
- `package.json` / `package-lock.json`：新增 devDependency `fake-indexeddb`，仅用于自动化测试中的 IndexedDB 隔离环境，不参与运行时功能。
- `src/App.vue`：历史区由文本占位替换为 `LocalHistoryPanel`，当前仍传入空历史列表；实际数据加载和完整操作接线放在主界面与流程集成阶段。

## 第 10 阶段更新文件
- `src/components/GenerationParamsPanel.vue`：生成参数表单增强，新增 API Key/配置可提交状态和生成中状态输入，Generate 按钮会在缺少 API Key、Prompt 无效或生成中时禁用；参考图和遮罩图支持缩略图预览、非图片拒绝提示和对象 URL 生命周期释放。
- `src/stores/generationParamsStore.ts`：新增 `loadSerializedParams`，用于从本地历史元数据恢复 Prompt、尺寸、数量、质量、背景、输出格式、压缩比例、图片 URL 和遮罩 URL，不恢复 API Key、本地参考图文件或本地遮罩文件。
- `src/App.vue`：主工作台接线增强，整合 API Key 状态、生成按钮可用性、当前结果移除、IndexedDB 可用性检测、历史列表加载、搜索、日期筛选、历史参数恢复、历史图片下载、单条删除和清空历史。仍未在该阶段发起图片请求，真实流程接入留给第 11 阶段。
- `tests/component/GenerationParamsPanel.test.ts`：生成参数组件测试扩展，覆盖 API Key 缺失禁用、loading 禁用、参考图上传预览、非图片拒绝、URL 校验、遮罩图预览和遮罩 URL。
- `tests/component/App.test.ts`：工作台壳层测试扩展，覆盖四个主区域、无 API Key 时生成按钮禁用，以及 API Key 不在输入框外泄露。

## 第 11 阶段新增与更新文件
- `src/services/generationWorkflow.ts`：生成流程编排服务，负责调用图片 API client、把 API 结果转换为当前图片结果、调用历史写入函数，并在历史写入失败时返回本地存储错误但保留当前结果；API 请求失败时直接抛出，不执行历史写入。
- `tests/unit/generationWorkflow.test.ts`：生成流程单元测试，覆盖成功生成写历史、API 失败不写历史、历史写入失败不丢当前结果。
- `src/App.vue`：流程集成更新，参数表单提交后创建 Sub2API client，执行生成流程，更新当前结果区、错误状态、保存状态和历史列表。文生图、本地参考图、URL 改图和 mask 均通过请求层统一决策。失败请求不写历史，历史保存失败不影响当前预览和下载。
- `src/storage/historyDb.ts`：缩略图生成增加受限环境降级；当 `createImageBitmap` 或 DOM 不可用时返回原图 Blob，避免测试环境或浏览器限制导致当前结果链路失败。
- `tests/component/AppWorkflow.test.ts`：App 级流程组件测试，使用模拟 Fetch 与 `fake-indexeddb` 验证文生图成功进入当前结果和历史、本地参考图走 multipart edits、URL + mask URL 走 JSON edits、无 API Key 不发送请求、认证失败不写历史。
