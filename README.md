# GPT Image 2 生图站

独立静态前端生图工具站，固定调用 Sub2API 后端 `https://uxde.de`，仅支持 `gpt-image-2`。项目不包含用户系统、后端代理、服务端数据库、服务端图片存储或对象存储 SDK。生成历史和图片 Blob 只保存在用户当前浏览器的 IndexedDB 中。

## 生产部署

- 正式前端域名: `https://image.uxde.de`
- 部署平台: Cloudflare Pages
- Sub2API 后端: `https://uxde.de`
- Cloudflare Pages 构建命令: `npm run build`
- Cloudflare Pages 产物目录: `dist`

生产环境变量:

```env
VITE_SUB2API_BASE_URL=https://uxde.de
VITE_APP_TITLE=GPT Image 2 生图站
VITE_HISTORY_MAX_ITEMS=50
VITE_HISTORY_MAX_BYTES=5368709120
VITE_REMEMBER_KEY_ENABLED=true
```

Sub2API 必须允许正式前端域名跨域访问:

```env
CORS_ALLOWED_ORIGINS=https://image.uxde.de
CORS_ALLOW_CREDENTIALS=false
```

## 本地运行

```bash
npm install
npm run dev
```

本地开发默认读取 `.env`。页面内不提供 Base URL 输入框，Sub2API Base URL 只能通过构建环境变量固定。

## 测试和构建

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

`npm run test:e2e` 默认启动本地 Vite 服务并运行 Playwright。部署后可用正式站点地址复用同一套 E2E:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://image.uxde.de"; npm run test:e2e
```

运行后如需恢复本地默认值:

```powershell
Remove-Item Env:\PLAYWRIGHT_BASE_URL
```

## API Key 存储

用户在浏览器输入自己的 Sub2API API Key。默认只保存到 `sessionStorage`，关闭浏览器会话后不永久保留。只有用户主动开启“记住密钥”时，API Key 才会保存到 `localStorage`。

API Key 不会写入 IndexedDB 历史、下载文件、导出数据、错误提示或控制台日志。网络请求中带 `Authorization: Bearer <api_key>` 的请求只应发往配置的 Sub2API 后端。

## 本地历史

生成图片、缩略图和生成参数保存在当前浏览器的 IndexedDB 中，默认最多保留 50 条或 5GiB。历史不会同步到服务器，换浏览器、换设备或清除浏览器数据后无法恢复。5GiB 是应用清理上限，实际可用空间仍受浏览器和设备配额限制。

历史面板支持查看、搜索、筛选、重新载入参数、下载、删除和清空。清空历史只影响 IndexedDB 图库，不会清除 API Key。

## 部署后冒烟测试

1. 打开 `https://image.uxde.de`，确认页面加载成功。
2. 在浏览器开发者工具确认静态资源无 404。
3. 输入测试 API Key，执行连接测试，确认没有 CORS 错误。
4. 执行一次模拟或真实文生图，确认图片可预览和下载。
5. 刷新页面，确认 IndexedDB 历史仍可查看。
6. 使用移动端视口完成输入密钥、填写 Prompt、生成、查看历史的核心流程。
