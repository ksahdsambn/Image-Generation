# tech-stack.md

## 独立 GPT Image 2 生图站技术栈

### Summary
本项目推荐采用“纯静态前端 + 固定 Sub2API 后端 + 浏览器本地图库”的技术架构。第一版不做用户系统、不做服务端图片存储、不接对象存储，重点保证部署简单、用户密钥不经过额外后端、图片历史只保存在用户浏览器本地。

### Recommended Stack
- 前端框架：Vue 3
- 构建工具：Vite
- 开发语言：TypeScript
- 样式方案：TailwindCSS
- 状态管理：Pinia
- 本地图片存储：IndexedDB
- IndexedDB 封装：Dexie.js
- HTTP 请求：原生 Fetch API
- 表单校验：VueUse + 轻量自定义校验
- 图标库：lucide-vue-next
- 文件下载：浏览器原生 Blob 下载
- 部署方式：静态站部署
- 推荐部署平台：Cloudflare Pages、Vercel、Netlify、Nginx 静态目录

### Why This Stack
- Vue 3 + Vite 适合快速构建独立工具站，启动快、构建简单、生态成熟。
- TypeScript 能降低请求参数、本地历史记录、图片结果处理中的类型错误。
- TailwindCSS 适合构建表单密集型工具界面，维护成本低。
- Pinia 适合管理 API Key 状态、当前生成参数、生成任务状态和历史记录状态。
- IndexedDB 适合保存图片 Blob 和缩略图，不应使用 localStorage 保存大图。
- Dexie.js 能简化 IndexedDB 操作，适合做本地图库、容量清理、分页读取。
- Fetch API 足够满足 JSON、multipart/form-data、错误处理和下载需求，不需要引入 Axios。
- lucide-vue-next 适合工具型按钮和图片操作图标，体积小、风格统一。

### Architecture
- 前端静态站直接调用 Sub2API：
  - 文生图：`/v1/images/generations`
  - 参考图/改图：`/v1/images/edits`
- Sub2API Base URL 通过构建环境变量固定。
- 用户在浏览器输入 Sub2API API Key。
- 生成结果返回后立即渲染预览，并写入 IndexedDB。
- 历史图库只存在当前浏览器，不上传服务器。
- 用户可以下载图片、删除历史、清空历史、重新载入参数。

### Storage Choice
- 图片正文：IndexedDB Blob
- 缩略图：IndexedDB Blob
- 生成参数：IndexedDB JSON 记录
- 轻量设置：localStorage，仅限主题、最近一次表单默认值、是否记住 API Key 等小字段
- API Key：默认 sessionStorage；用户选择“记住密钥”时才使用 localStorage
- 不使用服务器本地存储
- 不使用对象存储
- 不使用服务端数据库

### Deployment
- 推荐首选：Cloudflare Pages
- 备选：Vercel、Netlify、Nginx、Caddy
- 构建产物为纯静态文件。
- Sub2API 后端必须配置 CORS，将生图站域名加入允许来源。
- 如果使用同域反代，可通过反向代理规避 CORS 配置复杂度。

### Environment Configuration
- `VITE_SUB2API_BASE_URL`：固定 Sub2API 后端地址。
- `VITE_APP_TITLE`：站点标题。
- `VITE_HISTORY_MAX_ITEMS`：本地图库最大图片数，默认 50。
- `VITE_HISTORY_MAX_BYTES`：本地图库最大容量，默认 500MB。
- `VITE_REMEMBER_KEY_ENABLED`：是否允许用户记住 API Key。

### UI Libraries
- 不推荐引入大型组件库。
- 使用 TailwindCSS 自建表单、按钮、弹窗、图片网格和历史面板。
- 使用 lucide-vue-next 提供下载、删除、复制、上传、刷新、显示/隐藏密钥等图标。
- 复杂交互保持轻量，避免 Element Plus、Ant Design Vue 等大型依赖增加包体积。

### Testing Stack
- 单元测试：Vitest
- 组件测试：Vue Test Utils
- 浏览器端联调：Playwright
- 重点测试：
  - 请求参数构建
  - multipart/form-data 构建
  - API Key 状态管理
  - IndexedDB 写入、读取、删除、容量清理
  - 错误提示
  - 移动端和桌面端布局

### Not Recommended
- 不推荐 Next.js：本项目不需要服务端渲染和后端路由。
- 不推荐 Nuxt：当前需求是轻量静态工具站，Nuxt 会增加复杂度。
- 不推荐服务器本地存储：无用户系统时无法可靠归属图片，且运维风险高。
- 不推荐对象存储：第一版无云图库和分享需求，会增加索引、权限和清理复杂度。
- 不推荐 localStorage 存图片：容量小、性能差、不适合大图。
- 不推荐 Axios：Fetch API 已足够，减少依赖更合适。
- 不推荐大型 UI 组件库：工具站界面可控，轻量实现更利于性能和定制。

### Future Upgrade Path
- 如果后续需要云图库：新增轻量后端、服务端数据库索引和对象存储。
- 如果后续需要跨设备同步：新增用户系统或匿名恢复码机制。
- 如果后续需要公开分享：新增对象存储、签名链接、审核和过期策略。
- 如果后续需要商业化：新增账号、额度、支付、风控和服务端代理。
