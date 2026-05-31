# 项目架构

## 技术栈

- 前端框架: Vue 3
- 构建工具: Vite 8
- 开发语言: TypeScript 6
- 样式方案: TailwindCSS 4
- 状态管理: Pinia 3
- IndexedDB: Dexie.js 4
- HTTP 请求: 原生 Fetch API
- 图标库: @lucide/vue
- 工具函数: VueUse
- 单元测试: Vitest 4
- 组件测试: Vue Test Utils
- 浏览器测试: Playwright

## 目录结构

```
src/
├── __tests__/              # 测试文件 (单元测试、组件测试)
│   ├── framework.test.ts   # 测试框架验证测试
│   ├── config.test.ts      # 配置读取层单元测试 (19 项)
│   ├── error-handler.test.ts # 错误分类和脱敏单元测试 (25 项)
│   ├── generation-types.test.ts # 生成参数类型校验单元测试 (23 项)
│   ├── image-utils.test.ts # 图片转换工具单元测试 (14 项)
│   ├── security-protection.test.ts # 敏感信息保护单元测试 (17 项)
│   ├── storage-degradation.test.ts # 本地存储异常降级单元测试 (8 项)
│   ├── stores/             # Pinia 状态模块测试
│   │   ├── api-key.test.ts         # API Key 状态单元测试 (14 项)
│   │   └── generation-params.test.ts # 生成参数状态单元测试 (31 项)
│   ├── services/           # API 服务模块测试
│   │   ├── image-api.test.ts       # 图片 API 服务单元测试 (70 项)
│   │   └── response-parser.test.ts # 响应解析单元测试 (11 项)
│   ├── storage/            # IndexedDB 存储模块测试
│   │   ├── database.test.ts              # 数据库初始化/字段/安全单元测试 (12 项)
│   │   ├── history-writer.test.ts        # 历史写入单元测试 (6 项)
│   │   ├── history-reader.test.ts        # 历史读取/分页/搜索单元测试 (15 项)
│   │   ├── history-deleter.test.ts       # 历史删除/清空单元测试 (7 项)
│   │   ├── history-cleaner.test.ts       # 容量数量清理单元测试 (7 项)
│   │   └── storage-availability.test.ts  # 存储可用性检测单元测试 (3 项)
│   └── components/         # Vue 组件测试
│       ├── Workbench.test.ts       # 主工作台布局测试 (12 项)
│       ├── ApiKeyInput.test.ts     # API Key 配置 UI 和连接状态测试 (18 项)
│       ├── GenerationForm.test.ts  # 生成参数表单测试 (18 项)
│       ├── ReferenceImages.test.ts # 参考图和遮罩图测试 (19 项)
│       ├── ResultGrid.test.ts      # 结果展示测试 (10 项)
│       └── HistoryPanel.test.ts    # 本地历史面板测试 (11 项)
├── assets/          # 静态资源 (图片、字体等)
├── components/      # 可复用 Vue 组件
│   ├── ApiKeyInput.vue        # API Key 配置组件 (输入/显示隐藏/清除/记住密钥/连接测试按钮/连接状态)
│   ├── GenerationForm.vue     # 生成参数表单 (Prompt/尺寸/数量/质量/背景/格式/压缩)
│   ├── ReferenceImages.vue    # 参考图上传/URL组件 (本地图片/网页URL/冲突检测)
│   ├── MaskImageInput.vue     # 遮罩图输入组件 (文件上传/URL输入)
│   ├── ResultGrid.vue         # 结果展示网格 (空/加载/错误/成功状态/下载/复制/移除)
│   └── HistoryPanel.vue       # 本地历史面板 (搜索/筛选/参数重载/删除/清空/大图查看)
├── composables/     # Vue 组合式函数 (VueUse 封装等)
├── pages/           # 页面级组件
│   └── Workbench.vue          # 主工作台页面 (三栏布局/生成按钮/配置错误提示)
├── services/        # API 服务层 (Sub2API 请求构建)
│   ├── image-api.ts           # 图片 API 服务 (文生图/改图 multipart/改图 JSON/模式决策/文件校验)
│   ├── response-parser.ts     # 响应解析 (b64_json→Blob/MIME推断/对象URL管理)
│   └── connection-test.ts     # 连接测试服务 (GET /v1/models 只读检测/认证校验/CORS检测)
├── storage/         # IndexedDB 本地存储层 (Dexie.js)
│   ├── database.ts              # IndexedDB 数据库初始化/单例/可用性检测
│   ├── history-writer.ts        # 历史写入服务 (缩略图生成/单张批量写入)
│   ├── history-reader.ts        # 历史读取服务 (分页/搜索/日期筛选/计数/容量)
│   ├── history-deleter.ts       # 历史删除服务 (单条删除/清空全部)
│   ├── history-cleaner.ts       # 自动清理服务 (数量/容量上限清理)
│   └── storage-availability.ts  # 存储可用性检测 (降级提示)
├── stores/          # Pinia 状态管理模块
│   ├── api-key.ts           # API Key 状态管理 (会话/记住/显示隐藏/清除)
│   ├── generation-params.ts # 生成参数状态管理 (Prompt/尺寸/数量/质量/格式/参考图/遮罩)
│   └── generation.ts        # 生成状态管理 (generate动作/请求模式选择/结果管理/历史写入/对象URL释放)
├── types/           # TypeScript 类型定义
│   ├── api.ts                 # API 请求/响应类型 (ApiResponse/RequestMode/ParsedImageResult)
│   ├── errors.ts            # 错误分类模型 (11 种错误码 + 脱敏工具函数)
│   ├── generation.ts        # 生成参数类型 (尺寸/质量/背景/格式常量 + 校验函数)
│   └── history.ts           # 历史记录类型 (HistoryRecord/HistoryQueryParams/HistoryQueryResult)
├── utils/           # 工具函数 (格式化、转换等)
│   ├── config.ts            # 应用配置读取层 (环境变量解析 + 默认值回退)
│   └── image-utils.ts       # 图片转换工具 (b64→Blob/MIME推断/对象URL/文件名生成)
├── App.vue          # 根组件
├── main.ts          # 应用入口 (Vue + Pinia 注册)
└── style.css        # 全局样式 (TailwindCSS 入口)
```

根目录补充:

- `scripts/`: 本地开发和测试辅助脚本目录，目前包含 E2E 启动器。
- `public/`: 构建时原样复制的公共静态资源目录。
- `e2e/`: Playwright 浏览器端测试目录。
- `doc/`: 需求、计划、清单、架构和进度文档目录。
- `test-results/`: Playwright 运行生成的测试截图结果目录。

## 关键文件说明

| 文件 | 作用 |
|------|------|
| `index.html` | 应用 HTML 入口，标题从 VITE_APP_TITLE 环境变量读取 |
| `vite.config.ts` | Vite 构建配置，包含 Vue 插件、TailwindCSS 插件和路径别名 |
| `vitest.config.ts` | Vitest 测试配置，使用 jsdom 环境，setupFiles 配置 fake-indexeddb |
| `tsconfig.json` | TypeScript 项目引用根配置 |
| `tsconfig.app.json` | 应用 TypeScript 配置，包含路径别名 `@/` |
| `tsconfig.node.json` | Node 端 TypeScript 配置 (Vite/构建工具) |
| `package.json` | 项目依赖和脚本定义；`test:e2e` 通过 `scripts/run-e2e.mjs` 运行 Playwright |
| `package-lock.json` | npm 锁文件，固定依赖解析版本 |
| `README.md` | 项目说明文档，记录运行、构建和项目背景 |
| `.gitignore` | Git 忽略规则，排除依赖、构建产物、日志和编辑器临时文件 |
| `.env` | 环境变量 (VITE_SUB2API_BASE_URL, VITE_APP_TITLE 等) |
| `.env.production` | 生产构建环境变量，固定 Sub2API Base URL、标题、历史容量限制和记住密钥开关，不包含 API Key |
| `.env.example` | 环境变量示例文件 |
| `public/favicon.svg` | 站点 favicon 静态资源，随生产构建复制到 `dist` |
| `public/icons.svg` | 站点图标静态资源，随生产构建复制到 `dist` |
| `src/main.ts` | Vue 应用挂载入口，注册 Pinia 状态管理 |
| `src/App.vue` | 根组件，挂载 Workbench 主工作台页面 |
| `src/style.css` | TailwindCSS v4 导入入口 |
| `src/utils/config.ts` | 应用配置读取层，统一解析环境变量，Base URL 校验和默认值回退 |
| `src/types/errors.ts` | 错误分类模型 (11 种错误码)、HTTP/网络/存储错误分类函数、API Key 脱敏工具 |
| `src/types/generation.ts` | 生成参数类型定义 (尺寸/质量/背景/格式常量)、校验函数 (isValidSize/isValidCount/validatePrompt) |
| `src/stores/api-key.ts` | Pinia API Key 状态管理：sessionStorage 默认保存、localStorage 记住、显示隐藏、清除、脱敏 |
| `src/stores/generation-params.ts` | Pinia 生成参数状态管理：Prompt/尺寸/数量/质量/背景/格式/压缩/参考图/遮罩，请求体构建，参数重置 |
| `src/stores/connection.ts` | Pinia 连接状态管理：idle/testing/connected/error 四态、runTest() 执行测试、reset() 重置 (API Key 变更时) |
| `src/services/connection-test.ts` | 连接测试服务：GET /v1/models 只读检测、Bearer 认证校验、不消耗图片额度、全局错误分类 |
| `src/stores/generation.ts` | Pinia 生成状态管理：generate() 核心动作 (模式选择/API调用/响应解析/历史写入/自动清理)、isGenerating/currentResults/error/storageWarning 状态管理、对象URL释放 |
| `src/types/api.ts` | API 请求/响应类型定义：ApiResponse (data 数组)、RequestMode (4 种模式)、ParsedImageResult (Blob+MIME+revisedPrompt+objectUrl) |
| `src/services/image-api.ts` | 图片 API 服务核心模块：文生图 JSON 请求、本地参考图 multipart 请求、网页 URL JSON edits 请求、模式决策、文件/URL 校验、Bearer 认证、全局错误分类 |
| `src/services/response-parser.ts` | 响应解析模块：b64_json→Blob 转换、MIME 推断、revised_prompt 提取、对象 URL 创建与释放 |
| `src/utils/image-utils.ts` | 图片转换工具：base64→Blob、MIME 类型推断、文件扩展名推断、对象 URL 管理、文件名生成 |
| `src/pages/Workbench.vue` | 主工作台页面：三栏响应式布局 (表单/结果/历史)、生成按钮 (禁用/loading)、配置错误提示 |
| `src/components/ApiKeyInput.vue` | API Key 配置组件：密钥输入、显示/隐藏切换、清除、记住密钥+风险提示、连接测试按钮和连接状态 |
| `src/components/GenerationForm.vue` | 生成参数表单：Prompt 多行输入、尺寸/数量/质量/背景/格式选择器、压缩条件输入、重置 |
| `src/components/ReferenceImages.vue` | 参考图组件：本地上传+预览、网页URL添加删除、混用冲突警告、文件校验 |
| `src/components/MaskImageInput.vue` | 遮罩图组件：文件上传/URL输入、预览、清除 |
| `src/components/ResultGrid.vue` | 结果展示：空/加载/错误/成功四态、图片网格、下载/复制/移除、下载全部 |
| `src/components/HistoryPanel.vue` | 历史面板：搜索/日期筛选、缩略图列表、参数重载/下载/删除/清空、大图模态框、分页、watch lastGenerationTime 自动刷新 |
| `src/__tests__/config.test.ts` | 配置读取层单元测试：环境变量解析、默认值、Base URL 校验、非法值回退 |
| `src/__tests__/error-handler.test.ts` | 错误分类单元测试：HTTP 状态映射、网络错误分类、API Key 脱敏 |
| `src/__tests__/generation-types.test.ts` | 生成参数类型单元测试：尺寸/数量/质量/背景/格式校验 |
| `src/__tests__/stores/api-key.test.ts` | API Key 状态单元测试：设置/获取/保存/恢复/清除/显示/脱敏 |
| `src/__tests__/stores/generation-params.test.ts` | 生成参数状态单元测试：默认值/非法值/格式联动/请求体/重置 |
| `src/__tests__/services/image-api.test.ts` | 图片 API 服务单元测试：模式决策/文生图请求/multipart 改图/URL 改图/文件校验/URL 校验/错误分类 |
| `src/__tests__/services/response-parser.test.ts` | 响应解析单元测试：单图多图解析/revised_prompt/空数据防御/MIME 推断/对象 URL |
| `src/__tests__/image-utils.test.ts` | 图片转换工具单元测试：MIME 推断/扩展名推断/base64→Blob/文件名生成 |
| `src/types/history.ts` | 历史记录类型定义：HistoryRecord (Blob+参数+时间)、HistoryQueryParams (分页+搜索+日期)、HistoryQueryResult |
| `src/storage/database.ts` | Dexie.js IndexedDB 数据库：gpt-image-2-studio 数据库初始化、单例管理、可用性检测 |
| `src/storage/history-writer.ts` | 历史写入服务：Canvas 缩略图生成、可注入生成器、单张/批量写入、写入失败错误处理 |
| `src/storage/history-reader.ts` | 历史读取服务：分页查询 (倒序/搜索/日期筛选)、ID 查询、计数、总容量计算 |
| `src/storage/history-deleter.ts` | 历史删除服务：单条删除、清空全部 (不影响 API Key 存储) |
| `src/storage/history-cleaner.ts` | 自动清理服务：数量/容量上限检查、按时间删除最旧记录、优先保留最新 |
| `src/storage/storage-availability.ts` | 存储可用性检测：IndexedDB 可用性检查、缓存状态、降级消息 |
| `src/__tests__/storage/database.test.ts` | 数据库初始化/字段完整性/安全检查 (无 API Key) 单元测试 |
| `src/__tests__/storage/history-writer.test.ts` | 历史写入单元测试：写入成功/多图/缩略图/参数恢复/写入失败 |
| `src/__tests__/storage/history-reader.test.ts` | 历史读取单元测试：倒序/分页/搜索/日期筛选/ID查询/计数/容量 |
| `src/__tests__/storage/history-deleter.test.ts` | 历史删除单元测试：单条删除/清空/不影响 API Key |
| `src/__tests__/storage/history-cleaner.test.ts` | 自动清理单元测试：数量清理/容量清理/空库/优先保留最新 |
| `src/__tests__/storage/storage-availability.test.ts` | 存储可用性检测单元测试：可用检测/缓存/降级消息 |
| `src/__tests__/setup-indexeddb.ts` | 测试环境 IndexedDB polyfill (fake-indexeddb/auto) |
| `src/__tests__/components/Workbench.test.ts` | 主工作台布局测试：四区域渲染/按钮禁用/loading/可访问性 (12 项) |
| `src/__tests__/components/ApiKeyInput.test.ts` | API Key 配置 UI 测试：输入/显示隐藏/清除/记住/风险提示/不泄露/连接测试状态 (18 项) |
| `src/__tests__/components/GenerationForm.test.ts` | 生成参数表单测试：控件渲染/默认值/步进器/联动/压缩/重置 (18 项) |
| `src/__tests__/components/ReferenceImages.test.ts` | 参考图和遮罩图测试：上传预览/移除/校验/URL/冲突/遮罩 (19 项) |
| `src/__tests__/components/ResultGrid.test.ts` | 结果展示测试：四态/网格/下载/复制/移除/可访问性 (10 项) |
| `src/__tests__/components/HistoryPanel.test.ts` | 历史面板测试：搜索/筛选/空状态/重载/删除/清空/存储降级 (11 项) |
| `src/__tests__/stores/generation.test.ts` | 生成流程集成测试：提交决策(4场景)/请求模式选择(3模式)/错误处理(6类)/历史写入/存储警告/状态管理 (26 项) |
| `src/__tests__/services/connection-test.test.ts` | 连接测试服务单元测试：空Key拒绝/URL和请求头/成功失败/CORS网络/不调图片接口 (8 项) |
| `src/__tests__/stores/connection.test.ts` | 连接状态管理测试：idle/testing/connected/error四态/reset/错误清除 (6 项) |
| `src/__tests__/security-protection.test.ts` | 敏感信息保护测试：历史记录安全/下载安全/错误脱敏/控制台无泄露/API Key隔离 (17 项) |
| `src/__tests__/storage-degradation.test.ts` | 本地存储异常降级测试：存储不可用提示/写入失败保留结果/全部失败提示清空/容量清理/网络错误隔离 (8 项) |
| `playwright.config.ts` | Playwright E2E 测试配置：chromium 浏览器、127.0.0.1 baseURL、命令行/HTML 报告；支持 `PLAYWRIGHT_SKIP_WEBSERVER=1` 复用外部服务 |
| `e2e/app.spec.ts` | 浏览器端端到端测试 (16 项)：主流程/连接检查/API Key 只发送到 `https://uxde.de`/桌面移动平板布局/CORS错误/大图预览 |
| `scripts/run-e2e.mjs` | E2E 启动器：显式启动 Vite、本地服务可用后运行 Playwright、结束后关闭 Vite，避免 Windows 下内置 webServer 退出卡住 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_SUB2API_BASE_URL` | Sub2API 后端地址 (必填) | - |
| `VITE_APP_TITLE` | 应用标题 | GPT Image 2 生图站 |
| `VITE_HISTORY_MAX_ITEMS` | 本地历史最大数量 | 50 |
| `VITE_HISTORY_MAX_BYTES` | 本地历史最大容量 (字节) | 5368709120 (5GiB) |
| `VITE_REMEMBER_KEY_ENABLED` | 是否允许记住 API Key | true |

## 架构边界

- 纯前端静态站，无服务端渲染
- 不含后端服务、API 路由、服务端数据库或对象存储
- 图片历史仅保存在浏览器 IndexedDB
- API Key 默认 sessionStorage，可选 localStorage
- HTTP 请求仅使用 Fetch API，不使用 Axios
