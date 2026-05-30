# 开发进度

## AI 模型

zhipuai-coding-plan/glm-5.1

## 阶段 1: 执行原则

- 状态: 已完成
- 时间: 2026-05-30
- 内容: 确认并遵循 implementation-plan.md 中定义的全部执行原则，包括严格按步骤顺序执行、每步完成后验证测试、验证失败先修复、不新增超出范围实现

## 阶段 2: 项目初始化

### Step 1: 创建前端项目骨架

- 状态: 已完成
- 时间: 2026-05-30
- 操作内容:
  - 使用 Vite 创建 Vue 3 + TypeScript 项目
  - 配置 TailwindCSS v4 (@tailwindcss/vite 插件)
  - 配置路径别名 `@` -> `src/`
  - 清理默认示例代码 (HelloWorld.vue, hero.png, vite.svg, vue.svg)
  - 建立基础目录结构: pages, components, stores, services, storage, types, utils, composables, __tests__
  - 设置应用标题从环境变量 VITE_APP_TITLE 读取，默认 "GPT Image 2 生图站"
  - 创建 .env 和 .env.example
- 测试结果:
  - TypeScript 类型检查: 通过
  - 生产构建: 通过 (产物 dist/ 无服务端入口)
  - 开发服务启动: 通过 (http://localhost:5173 返回 200，标题正确)
  - 默认示例残留检查: 无残留

### Step 2: 安装并约束项目依赖

- 状态: 已完成
- 时间: 2026-05-30
- 操作内容:
  - 安装运行时依赖: pinia, dexie, @vueuse/core, @lucide/vue
  - 安装测试依赖: vitest, @vue/test-utils, jsdom, @playwright/test
  - 配置 vitest (vitest.config.ts, jsdom 环境)
  - 添加 test/test:watch/test:e2e 脚本
  - 创建框架验证测试
- 测试结果:
  - 推荐依赖检查: 全部存在 (vue, vite, tailwindcss, pinia, dexie, @vueuse/core, @lucide/vue, vitest, @vue/test-utils, @playwright/test)
  - 禁止依赖检查: 无发现 (axios, element-plus, ant-design-vue, nuxt, next, express, koa, s3, oss)
  - Vitest 空测试套件: 通过 (1 test passed)
  - 生产构建: 通过

## 初始化阶段门禁

- 项目可安装依赖: 通过
- 项目可启动开发服务: 通过
- 项目可生产构建: 通过
- 测试框架可运行: 通过
- 默认示例代码已清理: 通过
- 禁止依赖未出现: 通过

## 阶段 3: 配置系统

### Step 3: 建立环境变量配置

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/utils/config.ts` — 应用配置读取层
  - 统一读取 VITE_SUB2API_BASE_URL、VITE_APP_TITLE、VITE_HISTORY_MAX_ITEMS、VITE_HISTORY_MAX_BYTES、VITE_REMEMBER_KEY_ENABLED
  - Base URL 缺失时返回 configError，不发送任何请求
  - Base URL 自动移除末尾斜杠
  - 非法配置值回退到默认值 (数量 50, 容量 500MB, 记住密钥 true)
- 测试结果:
  - 单元测试: 19 项通过 (config.test.ts)
  - 覆盖: Base URL 缺失/空值/空白、末尾斜杠规范化、默认值回退、非法值回退

### Step 4: 建立全局错误分类规则

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/types/errors.ts` — 错误分类模型和脱敏工具
  - 11 种错误码: AUTH_FAILED, PERMISSION_DENIED, INSUFFICIENT_QUOTA, RATE_LIMITED, CORS_BLOCKED, NETWORK_ERROR, UPSTREAM_ERROR, STORAGE_ERROR, CONFIG_ERROR, VALIDATION_ERROR, UNKNOWN_ERROR
  - 每种错误对应中文用户提示
  - HTTP 状态码映射 (401/403/429/5xx)
  - 浏览器网络异常分类 (Failed to fetch/CORS/timeout)
  - API Key 脱敏: sanitizeText() 自动替换 sk-xxx 模式
  - 错误提示和 debugHint 均不包含 API Key
- 测试结果:
  - 单元测试: 25 项通过 (error-handler.test.ts)
  - 覆盖: 所有 HTTP 状态分类、网络错误分类、存储错误、API Key 脱敏、敏感信息检测

## 阶段 3 门禁

- TypeScript 类型检查: 通过
- 全部测试 (45 项): 通过
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 4: API Key 与状态管理

### Step 5: 实现 API Key 状态管理

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/stores/api-key.ts` — Pinia API Key 状态模块
  - 默认仅保存到 sessionStorage
  - 用户勾选"记住密钥"后才保存到 localStorage
  - localStorage 优先于 sessionStorage 恢复
  - 显示/隐藏密钥切换 (visible 状态)
  - 一键清除: 同时清空内存、sessionStorage、localStorage
  - getMaskedKey() 脱敏显示
  - API Key 不进入 IndexedDB
  - 更新 `src/main.ts` 注册 Pinia
- 测试结果:
  - 单元测试: 14 项通过 (stores/api-key.test.ts)
  - 覆盖: 默认空状态、设置/获取、sessionStorage 保存、localStorage 记住恢复、优先级、清除所有存储、显示切换、脱敏

### Step 6: 实现生成参数状态管理

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/types/generation.ts` — 生成参数类型定义和校验函数
    - 固定尺寸选项: 1024x1024, 1536x1024, 1024x1536
    - 数量范围: 1-10
    - 质量选项: auto, high, low
    - 背景选项: auto, transparent, opaque
    - 输出格式: png, webp, jpeg
    - 压缩仅适用于 webp/jpeg
    - 模型固定 gpt-image-2，response_format 固定 b64_json
  - 创建 `src/stores/generation-params.ts` — Pinia 生成参数状态模块
    - Prompt 必填校验 + 去空白
    - 非法尺寸/数量/质量/背景/格式拒绝
    - 输出格式与压缩联动
    - 本地参考图/网页图片 URL/遮罩图分别管理
    - 混用参考图源阻止提交
    - buildRequestBody() 构建请求体 (固定 model + response_format)
    - resetParams() 一键重置
- 测试结果:
  - 类型校验测试: 23 项通过 (generation-types.test.ts)
  - 状态管理测试: 31 项通过 (stores/generation-params.test.ts)
  - 覆盖: 默认值、非法值拒绝、格式联动、Prompt 校验、请求体构建 (gpt-image-2 + b64_json)、参数重置

## 阶段 4 门禁

- TypeScript 类型检查: 通过
- 全部测试 (113 项): 通过
  - framework.test.ts: 1 项
  - config.test.ts: 19 项
  - error-handler.test.ts: 25 项
  - generation-types.test.ts: 23 项
  - stores/api-key.test.ts: 14 项
  - stores/generation-params.test.ts: 31 项
- 生产构建: 通过 (dist/ 63.14 kB JS, 6.99 kB CSS)
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 5: Sub2API 请求层

### Step 7-10: 实现 Sub2API 请求层

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/types/api.ts` — API 请求/响应类型定义 (ApiResponse, RequestMode, ParsedImageResult)
  - 创建 `src/services/image-api.ts` — 图片 API 服务模块
    - decideRequestMode(): 根据本地参考图/网页 URL 自动选择请求模式 (generations/edits-multipart/edits-json/conflict)
    - buildGenerationsBody(): 文生图 JSON 请求体构建 (固定 gpt-image-2 + b64_json)
    - sendGenerationsRequest(): POST /v1/images/generations 发送
    - validateImageFile(): 文件类型 (PNG/JPEG/WebP/GIF) 和大小 (20MB) 校验
    - buildEditsMultipartBody(): 本地参考图 FormData 构建
    - sendEditsMultipartRequest(): POST /v1/images/edits multipart 发送
    - validateImageUrl(): URL 格式校验 (仅 http/https)
    - buildEditsJsonBody(): 网页图片 URL JSON 请求体构建 (images 数组 + mask.image_url)
    - sendEditsJsonRequest(): POST /v1/images/edits JSON 发送
    - 全部请求使用 Fetch API + Bearer 认证 + 全局错误分类
    - multipart 请求不手动设置 Content-Type
    - 仅提交有值的可选参数
  - 创建 `src/utils/image-utils.ts` — 图片转换工具
    - inferMimeType(): output_format → MIME 类型推断
    - inferFileExtension(): output_format → 文件扩展名
    - b64ToBlob(): base64 字符串 → Blob 转换
    - createImageObjectUrl() / revokeImageObjectUrl(): 对象 URL 管理
    - generateFilename(): 生成带时间戳和序号的文件名
  - 创建 `src/services/response-parser.ts` — 响应解析模块
    - parseApiResponse(): 解析 b64_json 响应 → ParsedImageResult[] (含 Blob, MIME, revisedPrompt, objectUrl)
    - releaseParsedResults(): 批量释放对象 URL
- 测试结果:
  - image-api.test.ts: 70 项通过
    - 覆盖: 模式决策 (4 场景)、文生图请求构建 (15 项含 URL/请求头/请求体/模型固定)、文生图发送 (12 项含成功/失败/错误分类)、文件校验 (5 项)、multipart 构建 (9 项)、multipart 发送 (7 项含 Content-Type 不手动设置)、URL 校验 (6 项)、JSON edits 构建 (7 项)、JSON edits 发送 (8 项)
  - image-utils.test.ts: 14 项通过
    - 覆盖: MIME 推断 (3 格式)、扩展名推断 (3 格式)、base64→Blob 转换 (4 项含二进制正确性)、文件名生成 (4 项)
  - response-parser.test.ts: 11 项通过
    - 覆盖: 单图/多图解析、revised_prompt 保存、空 data 防御、MIME 类型推断、对象 URL 创建/释放

## 阶段 5 门禁 (请求层完成门禁)

- 文生图请求构建测试: 通过
- multipart 改图请求构建测试: 通过 (含 FormData 字段、不手动设置 Content-Type)
- URL 改图请求构建测试: 通过 (含 images 数组、mask.image_url、URL 校验)
- 所有请求固定使用 gpt-image-2: 确认
- 所有请求固定返回 b64_json: 确认
- 错误分类测试: 通过 (HTTP 401/403/429/500 + 网络/CORS)
- 响应解析测试: 通过 (b64_json→Blob、MIME 推断、多图、revised_prompt)
- TypeScript 类型检查: 通过
- 全部测试 (208 项): 通过
  - framework.test.ts: 1 项
  - config.test.ts: 19 项
  - error-handler.test.ts: 25 项
  - generation-types.test.ts: 23 项
  - stores/api-key.test.ts: 14 项
  - stores/generation-params.test.ts: 31 项
  - image-api.test.ts: 70 项
  - image-utils.test.ts: 14 项
  - response-parser.test.ts: 11 项
- 生产构建: 通过 (dist/ 63.14 kB JS, 6.99 kB CSS)
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 6: IndexedDB 本地图库

### Step 11: 设计 IndexedDB 数据模型

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/types/history.ts` — 历史记录类型定义 (HistoryRecord, HistoryQueryParams, HistoryQueryResult)
  - 创建 `src/storage/database.ts` — Dexie.js IndexedDB 数据库 (gpt-image-2-studio, v1, history 表)
  - 安装 fake-indexeddb 测试依赖
  - 更新 vitest.config.ts 添加 setupFiles
  - 创建 `src/__tests__/setup-indexeddb.ts` — 测试环境 polyfill
- 测试结果:
  - database.test.ts: 12 项通过

### Step 12: 实现本地历史写入

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/storage/history-writer.ts` — 历史写入服务
  - generateThumbnail(): Canvas 缩略图生成 (最大 256px, 5s 超时降级)
  - writeHistory() / writeMultipleHistory(): 单张/批量写入
- 测试结果:
  - history-writer.test.ts: 6 项通过

### Step 13: 实现历史读取、分页和排序

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/storage/history-reader.ts` — 历史读取服务
  - queryHistory(): 分页查询 (倒序/搜索/日期筛选)
  - getHistoryById() / getHistoryCount() / getTotalBytes()
- 测试结果:
  - history-reader.test.ts: 15 项通过

### Step 14: 实现历史删除和清空

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/storage/history-deleter.ts` — deleteHistoryRecord() / clearAllHistory()
- 测试结果:
  - history-deleter.test.ts: 7 项通过

### Step 15: 实现容量和数量自动清理

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/storage/history-cleaner.ts` — enforceHistoryLimits()
  - 数量上限 50 条 + 容量上限 500MB, 优先保留最新
- 测试结果:
  - history-cleaner.test.ts: 7 项通过

### IndexedDB 不可用降级

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/storage/storage-availability.ts` — checkStorageAvailability() / getCachedAvailability()
- 测试结果:
  - storage-availability.test.ts: 3 项通过

## 阶段 6 门禁 (IndexedDB 阶段完成门禁)

- 历史记录可写入、读取、删除、清空: 通过
- 历史记录不包含 API Key: 通过
- 缩略图保存和读取可用: 通过
- 数量和容量清理可用: 通过
- IndexedDB 不可用时能降级: 通过
- TypeScript 类型检查: 通过
- 全部测试 (258 项): 通过
  - framework.test.ts: 1 项
  - config.test.ts: 19 项
  - error-handler.test.ts: 25 项
  - generation-types.test.ts: 23 项
  - image-utils.test.ts: 14 项
  - stores/api-key.test.ts: 14 项
  - stores/generation-params.test.ts: 31 项
  - image-api.test.ts: 70 项
  - response-parser.test.ts: 11 项
  - storage/database.test.ts: 12 项
  - storage/history-writer.test.ts: 6 项
  - storage/history-reader.test.ts: 15 项
  - storage/history-deleter.test.ts: 7 项
  - storage/history-cleaner.test.ts: 7 项
  - storage/storage-availability.test.ts: 3 项
- 生产构建: 通过 (dist/ 63.14 kB JS, 6.99 kB CSS)
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 7: 用户界面

### Step 16: 实现主工作台布局

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/stores/generation.ts` — Pinia 生成状态模块 (isGenerating, currentResults, error, loading/results/error 状态管理)
  - 创建 `src/pages/Workbench.vue` — 主工作台页面 (header + 三栏布局: 表单/结果/历史)
  - 创建 `src/components/ApiKeyInput.vue` — API Key 配置组件
  - 创建 `src/components/GenerationForm.vue` — 生成参数表单组件
  - 创建 `src/components/ReferenceImages.vue` — 参考图上传/URL 组件
  - 创建 `src/components/MaskImageInput.vue` — 遮罩图输入组件
  - 创建 `src/components/ResultGrid.vue` — 结果展示网格组件
  - 创建 `src/components/HistoryPanel.vue` — 本地历史面板组件
  - 更新 `src/App.vue` — 挂载 Workbench 页面
  - 桌面端三栏响应式布局 (lg:grid-cols-[360px_1fr_260px])
  - 移动端单列布局
  - 生成按钮: 缺少 API Key 或 Prompt 时禁用, 生成中 loading 状态
  - 配置错误时显示红色提示条
- 测试结果:
  - Workbench.test.ts: 12 项通过
  - 覆盖: 四区域渲染、API Key 缺失禁用、Prompt 为空禁用、有效状态启用、生成中 loading、可访问性标签

### Step 17: 实现 API Key 配置 UI

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 密钥输入框 (默认 password 类型)
  - 显示/隐藏切换 (Eye/EyeOff 图标)
  - 清除按钮 (仅密钥存在时显示)
  - "记住密钥"复选框 + 风险提示
  - 密钥不在其他区域明文展示
- 测试结果:
  - ApiKeyInput.test.ts: 12 项通过
  - 覆盖: 输入、类型切换、清除、记住密钥、风险提示、可访问性、密钥不泄露

### Step 18: 实现生成参数表单 UI

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - Prompt 多行输入 + 必填校验
  - 尺寸选择器 (1024x1024, 1536x1024, 1024x1536)
  - 数量步进器 (+/- 按钮, 范围 1-10)
  - 质量选择器 (自动/高清/低清)
  - 背景选择器 (自动/透明/不透明)
  - 输出格式选择器 (PNG/WebP/JPEG)
  - 压缩比例输入 (仅 webp/jpeg 时显示)
  - 重置参数按钮
  - 无模型选择器
- 测试结果:
  - GenerationForm.test.ts: 18 项通过
  - 覆盖: 所有控件渲染、默认值、步进器、上下限、格式联动、压缩条件显示、重置、无模型选择器

### Step 19: 实现参考图和遮罩图 UI

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 本地参考图上传区域 (文件选择 + 预览缩略图 + 移除)
  - 网页图片 URL 输入 (添加/删除多个 URL)
  - 混用冲突警告 (本地上传和网页 URL 不能同时使用)
  - 非图片文件拒绝 + 文件大小校验
  - 遮罩图: 上传本地文件 / 输入 URL / 清除
- 测试结果:
  - ReferenceImages.test.ts: 13 项通过 (ReferenceImages) + 6 项通过 (MaskImageInput)
  - 覆盖: 上传预览、移除、非图片拒绝、URL 添加删除、冲突警告、遮罩文件/URL 设置和清除

### Step 20: 实现结果展示 UI

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 空状态 / 加载状态 / 错误状态 / 成功状态
  - 图片网格展示 (响应式 grid)
  - 每张图片: 下载、复制、移除操作 (hover 显示)
  - 下载全部当前结果按钮
  - revised_prompt 显示
  - 移除结果不影响 IndexedDB 历史
- 测试结果:
  - ResultGrid.test.ts: 10 项通过
  - 覆盖: 空状态、错误状态、加载状态、结果网格、下载全部、移除、可访问性、revised_prompt

### Step 21: 实现本地历史 UI

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 搜索 Prompt 输入
  - 日期筛选 (开始/结束)
  - 历史列表 (缩略图 + Prompt 摘要 + 时间 + 参数)
  - 点击缩略图查看大图 (模态框)
  - 重新载入参数到表单
  - 下载历史图片
  - 删除单条 (确认对话框)
  - 清空全部 (确认对话框)
  - 空状态 / 加载中状态
  - 存储不可用降级提示
  - "仅保存在当前浏览器本地" 提示
  - 加载更多 (分页)
- 测试结果:
  - HistoryPanel.test.ts: 11 项通过
  - 覆盖: 搜索输入、日期筛选、空状态、清空按钮、参数重载、删除确认/取消、清空确认、存储不可用、搜索触发

## 阶段 7 门禁 (UI 阶段完成门禁)

- API Key 区可用: 通过
- 参数表单可用: 通过
- 参考图和遮罩图输入可用: 通过
- 当前结果区可用: 通过
- 历史区可用: 通过
- 桌面和移动端核心布局可用: 通过
- TypeScript 类型检查: 通过
- 全部测试 (340 项): 通过
  - 原有测试: 258 项 (15 文件)
  - 新增组件测试: 82 项 (6 文件)
    - Workbench.test.ts: 12 项
    - ApiKeyInput.test.ts: 12 项
    - GenerationForm.test.ts: 18 项
    - ReferenceImages.test.ts: 19 项
    - ResultGrid.test.ts: 10 项
    - HistoryPanel.test.ts: 11 项
- 生产构建: 通过 (dist/ 208.09 kB JS, 21.16 kB CSS)
- 无范围外依赖: 确认
- 无安全风险: 确认
