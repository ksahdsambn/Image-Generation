# requirements.md

## 独立 GPT Image 2 生图站需求方案

### Summary
建设一个独立静态生图网站，固定调用指定的 Sub2API 后端，只支持 `gpt-image-2` 模型。网站不做用户系统，不做服务器图库，不保存图片到服务器或对象存储；所有生成历史和图片结果保存在用户浏览器本地，用户自行下载和管理。

### Core Decisions
- 部署形态：独立静态前端站。
- 后端地址：构建时固定配置 `VITE_SUB2API_BASE_URL`。
- 模型：强制使用 `gpt-image-2`，前端不提供模型切换。
- 用户认证：用户输入自己的 Sub2API API Key。
- 图片存储：使用浏览器本地 `IndexedDB` 保存历史图片和生成参数。
- 服务器存储：不保存用户图片，不维护图库索引。
- API Key 存储：默认只保存在当前会话；可选“记住密钥”，但需要明确提示风险。

### Functional Requirements
- API Key 配置：
  - 用户输入 Sub2API API Key。
  - 支持显示/隐藏密钥。
  - 支持一键清除密钥。
  - 可选“记住密钥”，保存到浏览器本地；默认不永久保存。

- 文生图：
  - 调用 `POST /v1/images/generations`。
  - 请求固定包含 `model: "gpt-image-2"`。
  - 支持 Prompt、尺寸、数量、质量、背景、输出格式、压缩比例等参数。
  - 响应使用 `response_format: "b64_json"`，前端转换为图片预览。

- 参考图/改图：
  - 调用 `POST /v1/images/edits`。
  - 支持上传本地参考图。
  - 支持输入网页图片 URL。
  - 支持可选遮罩图。
  - 支持多参考图时按 Sub2API 兼容格式提交。

- 本地图库：
  - 使用 `IndexedDB` 保存生成历史。
  - 每条记录保存图片 Blob、缩略图、Prompt、参数、生成时间、输出格式。
  - 支持查看历史、重新载入参数、下载单张、删除单条、清空全部。
  - 设置本地容量策略：默认最多保存最近 50 张或 500MB，超过后自动删除最旧记录。
  - 提供“导出图片”或“下载全部当前结果”。

- 错误处理：
  - API Key 缺失时阻止提交。
  - CORS、余额不足、无图片权限、限流、上游失败等错误给出清晰提示。
  - 生成失败不写入历史。
  - 图片保存到 IndexedDB 失败时提示用户下载图片，避免结果丢失。

### API Requirements
- Base URL：
  - 从环境变量读取：`VITE_SUB2API_BASE_URL=https://your-sub2api.example.com`。
  - 前端不提供 Base URL 输入框。

- 文生图请求：
  - URL：`${VITE_SUB2API_BASE_URL}/v1/images/generations`
  - Method：`POST`
  - Headers：
    - `Authorization: Bearer <api_key>`
    - `Content-Type: application/json`
  - Body：
    - `model: "gpt-image-2"`
    - `prompt`
    - `size`
    - `n`
    - `quality`
    - `background`
    - `output_format`
    - `output_compression`
    - `response_format: "b64_json"`

- 改图请求：
  - URL：`${VITE_SUB2API_BASE_URL}/v1/images/edits`
  - 本地图片使用 `multipart/form-data`。
  - 网页图片使用 JSON `images: [{ image_url: "..." }]`。
  - 固定 `model: "gpt-image-2"`。

### Storage Requirements
- 图片不上传到服务器、不上传对象存储。
- 图片历史只保存在当前浏览器的 `IndexedDB`。
- 清浏览器数据、换设备、换浏览器后历史不可恢复。
- 不使用 `localStorage` 保存大图。
- `localStorage` 只允许保存轻量设置，例如主题、最近一次表单默认值、是否记住 API Key；不得保存图片、base64、完整历史记录或 IndexedDB 图库副本。
- API Key 如用户选择记住，保存前端本地；不进入图库记录、下载文件或任何导出相关数据。

### UI Requirements
- 首页即为生图工作台，不做营销落地页。
- 页面区域：
  - 顶部：站点标题、API Key 输入、连接状态。
  - 左侧或顶部表单：Prompt、参数、参考图、遮罩图。
  - 主区域：生成结果图片网格。
  - 右侧或下方：本地历史记录。
- 支持桌面和移动端。
- 生成按钮需要 loading 状态，重复点击时禁用。
- 图片卡片提供下载、复制、删除、重新生成。
- 不在界面中出现可编辑模型选择器。

### Configuration Requirements
- Sub2API 后端需要配置 CORS：
  - 将生图站域名加入 `cors.allowed_origins`。
  - 如果同域反代，则可不依赖跨域。
- Sub2API 用户 API Key 所属分组必须启用图片生成权限。
- Sub2API 后端需要存在可用 OpenAI 图片账号，并支持 `gpt-image-2`。

### Non-Goals
- 不做用户注册/登录。
- 不做云端图库。
- 不做图片分享链接。
- 不做服务器本地图片存储。
- 不做对象存储上传。
- 不做后台管理系统。
- 不支持除 `gpt-image-2` 以外的模型。

### Test Plan
- 请求构建测试：
  - 文生图 JSON 请求固定使用 `gpt-image-2`。
  - 改图 multipart 请求包含 `model`、`prompt`、`image`、可选 `mask`。
  - 网页图片 URL 请求格式正确。

- 本地存储测试：
  - 生成成功后写入 IndexedDB。
  - 历史记录可读取、删除、清空。
  - 超过数量或容量上限时自动清理旧记录。
  - IndexedDB 写入失败时显示可恢复提示。

- 浏览器联调：
  - 无 API Key 时不能提交。
  - 错误 API Key 显示认证错误。
  - 无图片权限显示权限错误。
  - CORS 未配置时显示跨域配置提示。
  - 成功生成后图片可预览、下载、进入历史。
  - 刷新页面后历史仍可查看。

### Assumptions
- 第一版以个人工具站和轻量公开站为目标。
- 用户理解图片历史只保存在本机浏览器。
- 后续如果需要跨设备图库、分享链接或云保存，需要新增轻量用户身份或恢复码机制。
