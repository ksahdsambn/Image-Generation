# 开发进度

## AI 模型

zhipuai-coding-plan/glm-5.1

本轮执行模型: GPT-5 Codex

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
  - 非法配置值回退到默认值 (数量 50, 容量 5GiB, 记住密钥 true)
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
  - 数量上限 50 条 + 容量上限 5GiB, 优先保留最新
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
  - 质量选择器 (自动/低清/中等/高清)
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

## 阶段 8: 生成流程集成

### Step 22: 实现提交决策流程

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 重构 `src/stores/generation.ts` — 新增 generate() 核心生成动作
    - 根据 decideRequestMode() 自动选择请求模式 (generations/edits-multipart/edits-json)
    - 提交前统一校验 API Key、Prompt、混用冲突
    - 成功后解析响应 → 设置当前结果 → 写入 IndexedDB 历史 → 执行自动清理
    - 失败时设置错误状态、不写入历史、保留当前结果供重试
    - 写入历史失败时设置 storageWarning、保留当前结果可预览/下载
    - isGenerating 状态全程管理 (finally 保证重置)
  - 更新 `src/pages/Workbench.vue` — handleGenerate() 调用 generate 动作
  - 更新 `src/components/ResultGrid.vue` — 新增 storageWarning 展示
- 测试结果:
  - generation.test.ts: 26 项通过
    - 覆盖: API Key 缺失/Prompt 空/混用冲突阻止提交、三种模式选择正确接口、成功写入历史(含多图)、失败不写历史、错误分类(401/403/429/500/CORS/网络)、空响应防御、存储警告保留结果、isGenerating 状态管理
  - API Key 不进入历史记录: 确认

### Step 23: 实现连接状态检查

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `src/services/connection-test.ts` — 连接测试服务
    - GET /v1/models 只读接口检测 (不消耗图片额度)
    - Bearer 认证头校验
    - 全局错误分类 (401/403/网络/CORS)
    - 不调用图片生成接口
  - 创建 `src/stores/connection.ts` — Pinia 连接状态管理
    - idle/testing/connected/error 四态管理
    - runTest() 执行测试
    - reset() 重置状态 (API Key 变更时触发)
  - 更新 `src/components/ApiKeyInput.vue` — 连接测试 UI
    - 连接测试按钮 (Wifi 图标 + loading/connected/error 状态图标)
    - "连接正常" 成功提示
    - 错误提示 (使用错误分类文案)
    - API Key 变更自动重置连接状态
- 测试结果:
  - connection-test.test.ts: 8 项通过
    - 覆盖: 空Key/空白Key拒绝、正确URL和请求头、200成功、401认证失败、CORS失败、网络失败、不调用图片接口
  - connection.test.ts: 6 项通过
    - 覆盖: 初始idle、成功connected、失败error、testing中间态、reset重置、错误清除
  - ApiKeyInput.test.ts: 新增 6 项 (共 18 项)
    - 覆盖: 测试按钮显隐、可访问标签、成功提示、错误提示、Key变更重置

## 阶段 8 门禁 (生成流程集成完成门禁)

- 三种输入场景选择正确接口: 通过 (generations/edits-multipart/edits-json)
- 非法混用场景被阻止: 通过
- API Key 缺失时不会发请求: 通过
- Prompt 缺失时不会发请求: 通过
- 提交期间生成按钮禁用: 通过
- 失败请求不写入历史: 通过
- 成功生成后结果区和历史区同时更新: 通过
- 连接测试使用只读接口: 通过 (GET /v1/models)
- 连接测试不消耗图片额度: 确认
- 连接测试正确显示认证错误: 通过
- 连接测试正确显示 CORS 失败: 通过
- API Key 修改后连接状态重置: 通过
- TypeScript 类型检查: 通过
- 全部测试 (386 项): 通过
  - 原有测试: 340 项 (21 文件)
  - 新增测试: 46 项 (4 文件)
    - stores/generation.test.ts: 26 项
    - services/connection-test.test.ts: 8 项
    - stores/connection.test.ts: 6 项
    - components/ApiKeyInput.test.ts: +6 项
- 生产构建: 通过 (dist/ 221.23 kB JS, 21.38 kB CSS)
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 9: 质量与安全

### Step 24: 实现敏感信息保护检查

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 全面审计所有源码模块 (stores/services/storage/types/utils/components) 的敏感信息保护
  - 修复 `src/stores/generation.ts:193` — 未知错误 fallback 的 `debugHint` 增加 `sanitizeText()` 保护
  - 确认 API Key 仅存在于 api-key store、不进入 IndexedDB、不出现在错误提示/下载/导出
  - 确认生产源码中不存在 console.log/warn/error
  - 创建 `src/__tests__/security-protection.test.ts` — 17 项安全保护测试
- 测试结果:
  - security-protection.test.ts: 17 项通过
  - 覆盖: 历史记录序列化不含 API Key、下载/导出数据不含 API Key、错误对象脱敏、控制台无敏感输出、API Key 隔离检查

### Step 25: 实现响应式和可用性打磨

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - Workbench header: 移动端从 `flex-row` 改为 `flex-col sm:flex-row`，API Key 区域全宽
  - GenerationForm: 所有表单控件 `grid-cols-2` 改为 `grid-cols-1 sm:grid-cols-2`，窄屏单列
  - ResultGrid: 移动端操作按钮始终可见 (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`)
  - MaskImageInput: 上传按钮和 URL 输入窄屏改为垂直堆叠 (`flex-col sm:flex-row`)
- 测试结果:
  - 全量测试: 403 项通过 (无新增失败)
  - TypeScript 类型检查: 通过
  - 生产构建: 通过

### Step 26: 实现本地存储异常降级

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 增强 `src/stores/generation.ts` — 全部写入失败时 storageWarning 提示用户清空历史重试
  - 创建 `src/__tests__/storage-degradation.test.ts` — 8 项降级测试
  - 覆盖: 存储不可用时提示下载、写入失败保留结果、全部失败提示清空历史、容量不足触发自动清理、网络错误不影响本地
- 测试结果:
  - storage-degradation.test.ts: 8 项通过

## 阶段 9 门禁 (质量与安全完成门禁)

- 历史记录序列化结果不包含 API Key: 通过
- 任何下载或导出相关数据不包含 API Key: 通过
- 错误对象脱敏: 通过
- 控制台无敏感信息输出: 通过
- 参数表单在窄屏下改为单列: 通过
- 图片网格在桌面端多列移动端单列: 通过
- 移动端操作按钮始终可见: 通过
- IndexedDB 不可用时历史功能禁用: 通过
- 写入失败时当前结果仍保留: 通过
- 容量不足时触发自动清理: 通过
- TypeScript 类型检查: 通过
- 全部测试 (411 项): 通过
  - 原有测试: 386 项 (25 文件)
  - 新增测试: 25 项 (2 文件)
    - security-protection.test.ts: 17 项
    - storage-degradation.test.ts: 8 项
- 生产构建: 通过 (dist/ 221.63 kB JS, 21.63 kB CSS)
- 构建产物无真实 API Key: 确认
- 无范围外依赖: 确认
- 无安全风险: 确认

## 阶段 10: 测试与验收

### Step 27: 完成单元测试套件

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 修复 6 个 TypeScript 类型错误:
    - `src/stores/generation.ts` — 移除未使用 `MaskImage` 导入
    - `src/__tests__/components/ApiKeyInput.test.ts` — 移除未使用 `vi` 导入
    - `src/__tests__/security-protection.test.ts` — 移除未使用 `beforeEach` 导入和 `blob` 变量
    - `src/__tests__/services/connection-test.test.ts` — 移除未使用 `beforeEach` 导入
    - `src/__tests__/stores/generation.test.ts` — 移除未使用 `resetThumbnailGenerator` 导入和 `writeMultipleHistory` 变量
    - `src/__tests__/storage-degradation.test.ts` — 修复 mock store 类型断言 (`any`)、修复 `enforceHistoryLimits` 返回值类型、移除未使用变量
  - 全部 26 个测试文件、411 项测试通过
  - TypeScript 类型检查通过 (vue-tsc -b 零错误)
  - 生产构建通过 (dist/ 221.63 kB JS, 21.66 kB CSS)
- 测试结果:
  - 全部单元测试: 411 项通过 (26 文件)
  - 人工检查: 测试不依赖真实 Sub2API 密钥，失败用例能定位具体行为

### Step 28: 完成组件测试套件

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 确认全部组件测试通过 (82 项)
  - 确认组件测试不调用真实网络 (无 fetch/axios)
  - 确认组件测试不依赖真实浏览器持久数据 (使用 fake-indexeddb)
- 测试结果:
  - Workbench.test.ts: 12 项通过
  - ApiKeyInput.test.ts: 18 项通过
  - GenerationForm.test.ts: 18 项通过
  - ReferenceImages.test.ts: 19 项通过
  - ResultGrid.test.ts: 10 项通过
  - HistoryPanel.test.ts: 11 项通过

### Step 29: 完成浏览器端端到端测试 (Playwright)

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 创建 `playwright.config.ts` — Playwright 配置 (chromium, webServer dev server, 截图/视频)
  - 创建 `e2e/app.spec.ts` — 16 项浏览器端端到端测试
    - 无 API Key 时不允许提交
    - 输入 API Key 后仍需 Prompt 才能提交
    - 错误 API Key 显示认证错误
    - 模拟成功文生图后图片可预览并进入历史
    - 失败请求不写历史
    - 刷新页面后 IndexedDB 历史仍可查看
    - 删除历史记录生效
    - 清空全部历史生效
    - 连接测试成功显示连接正常
    - 连接测试失败显示错误
    - API Key 只发送到配置的 Sub2API 后端
    - 桌面端无明显布局重叠 (1280x800)
    - 移动端核心流程可用 (375x812)
    - 平板端布局正常 (1024x768)
    - CORS/网络失败显示错误提示
    - 模拟大图响应可预览
  - 使用模拟 Sub2API 响应，不使用真实生产 API Key
  - 所有测试使用 `page.route()` 拦截网络请求
  - 修复真实 Bug: HistoryPanel 生成后不自动刷新历史列表
    - 添加 `watch(generationStore.lastGenerationTime)` 触发历史重载
    - 将 `lastGenerationTime` 设置时机从写入前移到写入后 (确保历史已持久化再通知 UI)
- 测试结果:
  - Playwright E2E: 16/16 通过 (8.5s)
  - Vitest 单元+组件: 411/411 通过 (确认无回归)

### Step 30: 完成真实 Sub2API 联调

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: zhipuai-coding-plan/glm-5.1
- 操作内容:
  - 更新 `.env` 中 `VITE_SUB2API_BASE_URL=https://uxde.de`
  - Sub2API 后端 CORS 配置: `CORS_ALLOWED_ORIGINS=https://image.uxde.de`
  - 修复 Bug: Sub2API 返回 HTTP 200 但 body 包含 `{"error": {...}}` 时前端未正确处理
    - 在 `src/services/image-api.ts` 三个请求函数中增加响应体错误检测
    - 当 JSON 响应包含 `error` 字段且无 `data` 字段时，按错误分类处理
  - 真实联调测试:
    - 30.1 连接测试: GET /v1/models 返回 200，gpt-image-2 模型在列表中
    - 30.2 文生图: POST /v1/images/generations 返回 200，~2.1MB b64_json 图片
    - 30.3 本地参考图改图: POST /v1/images/edits multipart 返回 200，~2.5MB b64_json 图片
    - 30.4 网页图片 URL 改图: POST /v1/images/edits JSON 返回上游错误 (Sub2API 上游限制)，前端正确显示错误提示
  - 联调后清理: 测试临时文件已删除，测试 API Key 未写入代码/配置/构建产物
- 测试结果:
  - 浏览器真实请求文生图: 成功 (200, ~2.1MB b64_json)
  - 浏览器真实请求本地参考图改图: 成功 (200, ~2.5MB b64_json)
  - 浏览器真实请求网页图片 URL 改图: 上游限制返回错误，前端正确显示错误提示
  - 构建产物无真实 API Key: 确认
  - 全部测试 411 项通过，TypeScript 零错误，生产构建通过

## 阶段 10 门禁 (测试与验收完成门禁)

- 全部单元测试通过: 确认 (411 项)
- 全部组件测试通过: 确认 (82 项)
- 全部 Playwright 测试通过: 确认 (16 项)
- 类型检查通过: 确认 (vue-tsc -b 零错误)
- 生产构建通过: 确认 (dist/ 221.94 kB JS, 21.66 kB CSS)
- 构建产物无真实 API Key: 确认
- 构建产物无测试图片和测试响应: 确认
- 无范围外依赖: 确认
- 无安全风险: 确认
- 真实 Sub2API 联调: 通过 (文生图+改图成功, URL改图错误提示清晰)

## 阶段 11: 构建与部署

### Step 31: 完成生产构建配置

- 状态: 已完成
- 时间: 2026-05-31
- AI 模型: GPT-5 Codex
- 对应清单: 17.1、17.2、17.3
- 操作内容:
  - 同步 `task-checklist.md` 中 Step 30 对应的 16.1-16.6 勾选状态，确保进入 Step 31 前不存在未完成的 16.x 项。
  - 新增 `.env.production`，生产环境变量固定为:
    - `VITE_SUB2API_BASE_URL=https://uxde.de`
    - `VITE_APP_TITLE=GPT Image 2 生图站`
    - `VITE_HISTORY_MAX_ITEMS=50`
    - `VITE_HISTORY_MAX_BYTES=5368709120`
    - `VITE_REMEMBER_KEY_ENABLED=true`
  - 修复 `e2e/app.spec.ts` 中 API Key 安全测试的旧示例域名断言，改为校验当前生产 Sub2API origin: `https://uxde.de`。
  - 调整 `playwright.config.ts`，支持 `PLAYWRIGHT_SKIP_WEBSERVER=1` 时复用外部已启动服务，并把 baseURL 固定为 `http://127.0.0.1:5173`。
  - 新增 `scripts/run-e2e.mjs`，由 Node 显式启动 Vite、等待本地服务可访问、执行 Playwright、结束后关闭 Vite，解决 Windows 下 Playwright 内置 webServer 退出卡住的问题。
  - 更新 `package.json` 的 `test:e2e` 脚本为 `node scripts/run-e2e.mjs`。
  - 执行构建产物安全检查，确认 `dist` 不包含真实/测试 API Key、测试图片 base64、测试响应文本、示例后端地址或本地开发地址。
- 失败处理记录:
  - 首次 `npm.cmd run test:e2e` 失败: 测试仍断言旧示例域名 `your-sub2api.example.com`，实际请求已按生产配置发往 `https://uxde.de`；判定为测试断言错误，已修复并重跑完整 17.2 门禁。
  - 后续 Playwright 用例均已运行但进程在内置 webServer 退出阶段超时；判定为 Windows 测试运行环境问题，已用 `scripts/run-e2e.mjs` 修复，未改动业务逻辑。
- 测试结果:
  - TypeScript 类型检查: 通过 (`npx.cmd vue-tsc -b`)
  - 单元 + 组件测试: 通过 (`npm.cmd test`, 26 文件 / 411 项)
  - Playwright E2E: 通过 (`npm.cmd run test:e2e`, 16 项)
  - 生产构建: 通过 (`npm.cmd run build`, JS 221.94 kB, CSS 21.66 kB)
  - 本地预览构建产物: 通过 (`vite preview` 首页 HTTP 200)
  - 构建产物安全扫描: 通过
- 是否放行: 放行。Step 31 已完成，未进入 17.4 部署静态站。

## 阶段 11 门禁 (Step 31 范围)

- 生产环境变量已配置: 通过
- Sub2API Base URL 指向目标后端: 通过 (`https://uxde.de`)
- 应用标题和历史限制为生产值: 通过
- 类型检查通过: 确认
- 单元测试通过: 确认 (411 项中含单元测试)
- 组件测试通过: 确认 (411 项中含组件测试)
- Playwright 测试通过: 确认 (16 项)
- 生产构建通过: 确认
- 构建产物无真实 API Key: 确认
- 构建产物无测试 API Key、测试图片和测试响应: 确认
- 本地预览构建产物首页可打开: 确认
