# 修复记录

## 2026-06-01 UI 风格大胆化增强
- 操作模型ID: GPT-5 Codex
- 范围: 使用 `bolder` skill，并按其要求参考 `frontend-design` 原则，对当前 Vue/Tailwind 前端仅做视觉表现、装饰层、颜色层级、阴影、边框、背景、按钮、卡片和交互状态增强；未修改生成流程、API 请求、历史写入、上传、密钥管理、store、service、types、数据结构、核心功能或桌面三栏/移动顺序。
- 修改内容:
  - `src/style.css`: 在现有浅色图像工作台风格上增强 OKLCH 视觉 token，补充更深的文字层级、热珊瑚、氧化赭色、酸性黄绿和更强卡片阴影，让色彩和层次更有识别度。
  - `src/style.css`: 强化首屏背景肌理、顶栏底部识别轨、卡片顶部彩色轨和结果区专属画布质感，保留现有布局和组件层级。
  - `src/style.css`: 强化主生成按钮的材质、边界、阴影、hover 扫光反馈和生成态基础视觉；增强输入框 focus、上传参考图区 checker 质感、结果空/加载态画布焦点、结果卡片顶部轨、历史项选中/hover 视觉层级。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - Playwright CLI 桌面截图检查 `1440x900`: 首屏三栏布局分配保持不变，首屏视觉识别度、结果区和右侧历史层级更强。
  - Playwright CLI 移动截图检查 `375x812`: 现有移动端顺序保持不变，未发现文字遮挡或横向滚动。
  - Playwright 长内容响应式检查: 注入长 Prompt、长网页图片 URL、模拟生成结果和历史项后，`320x780`、`375x812`、`768x1024`、`1440x900` 的 document/body horizontal overflow 均为 0，visible overflow offenders 均为空。

## 2026-06-01 UI 配色层次增强
- 操作模型ID: GPT-5 Codex
- 范围: 使用 `colorize` skill，并按其要求参考 `frontend-design` 原则，对当前 Vue/Tailwind 前端 UI 仅做颜色系统、状态色、层次色、背景色、按钮色、边框色和强调色增强；未修改生成逻辑、上传逻辑、历史逻辑、密钥逻辑、API 请求逻辑、store、service、types、数据结构、核心功能入口或页面主要布局分配。
- 修改内容:
  - `src/style.css`: 将原有分散的暖色 studio 颜色升级为 OKLCH 语义 token，补充暖中性、矿物绿灰、青绿色、赭橙、琥珀、成功绿、错误玫红等角色色，并通过 utility 层覆盖 Tailwind 工具类，保证颜色增强稳定生效。
  - `src/style.css`: 优化页面背景、顶栏、卡片表面、主按钮、次级/图标按钮、输入框、选择器、上传区、结果空状态、历史空状态、历史选中态、图片弹窗和焦点环颜色表现，降低整页米色占比，保留摄影工作台基调并增加冷暖层次。
  - `src/style.css`: 统一错误、警告、成功、连接状态、记住密钥风险提示、URL 校验错误、存储警告等语义状态色，提升状态辨识度和文本可读性。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - Playwright 视觉/响应检查: `1440x900` 与 `375x812` 注入 Prompt、API Key 和 URL 错误状态后 document/body horizontal overflow 均为 0。
  - 本地预览服务: `http://127.0.0.1:5174/`。

## 2026-06-01 UI 质量审查与可访问性修复

- 操作模型ID: GPT-5 Codex
- 范围: 使用 `audit` skill，并按其要求参考 `frontend-design` 原则，对当前 Vue/Tailwind 前端 UI 做可访问性、响应式、视觉一致性、状态反馈、动效降级和长文本健壮性审查与修复；未修改生成逻辑、上传逻辑、历史写入/读取逻辑、密钥逻辑、API 请求逻辑、store、service、types、数据结构或页面主要区域分配。
- 修复内容:
  - `src/components/HistoryPanel.vue`: 为历史记录项和缩略图预览补充键盘访问、焦点入口、ARIA 语义和选中状态；为日期筛选、搜索输入、加载/警告状态、大图弹窗补充可访问名称、live region 和 `dialog` 语义；提升历史辅助文本和图标按钮对比度，并在长历史文本下保持截断防溢出。
  - `src/components/ReferenceImages.vue`、`src/components/MaskImageInput.vue`: 为 URL 输入、隐藏文件输入、错误/警告状态和长 URL 展示补充可访问名称、alert/live 语义、hover title 与装饰图标隐藏；统一移除按钮尺寸和颜色对比。
  - `src/components/ResultGrid.vue`: 为错误、警告、加载状态补充 `alert/status` 与 `aria-live`；扩大移动/平板结果操作按钮触控尺寸；提升空状态、结果 revised prompt 与按钮图标的可读性。
  - `src/components/ApiKeyInput.vue`、`src/components/GenerationForm.vue`、`src/pages/Workbench.vue`: 提升密钥区、重置按钮和顶栏辅助文本对比度；补充装饰图标 `aria-hidden`；扩大记住密钥点击区域。
  - `src/style.css`: 为历史记录可聚焦区域补充统一 `focus-visible` 样式；在移动/平板和粗指针设备下增加 44px 以上触控保护；继续保留 `prefers-reduced-motion` 动效降级。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - Playwright 响应式检查: 注入长 Prompt、长 URL、模拟结果和历史记录后，`320x780`、`390x844`、`768x1024`、`1440x900` 均无 document/body 横向溢出、无未命名输入、无小于 44px 的移动/平板有效点击目标；`1024x768` 粗指针模拟无横向溢出且无小于 44px 的有效点击目标。
  - Playwright 可访问性检查: 历史记录项可键盘聚焦并带 `role/button` 与 `tabindex`；历史缩略图可键盘打开大图；大图弹窗带 `role=dialog`、`aria-modal=true` 和可访问名称。
  - Playwright reduced motion 检查: `prefers-reduced-motion: reduce` 下页面仍无横向溢出，动画/过渡降级保持生效。

## 2026-06-01 UI 交互动效增强

- 操作模型ID: GPT-5 Codex
- 范围: 使用 `animate` skill，并按其要求参考 `frontend-design` 原则，为当前 Vue/Tailwind 前端增加克制、实用的交互动效；未修改生成流程、API 请求、历史写入、上传、密钥管理、store、service、types、数据结构或核心交互路径。
- 修改内容:
  - `src/style.css`: 新增统一 motion token、自然缓动曲线、卡片/结果/历史/状态块的轻量进入反馈、按钮 hover/active/focus 过渡、输入框 focus 反馈、上传区域 hover 扫光、结果和历史项 hover/selected 质感、连接/错误/警告状态出现反馈、图片预览弹窗出现反馈，并补强 `prefers-reduced-motion` 降级。
  - `src/pages/Workbench.vue`: 仅为生成中按钮增加展示态 class 和加载态光标/颜色 class，保持点击、禁用和生成逻辑不变。
  - `src/components/HistoryPanel.vue`: 仅为当前选中历史项增加 `is-selected` 展示 class，保持历史选择、重载、下载、删除和预览逻辑不变。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - 内置浏览器检查 `http://127.0.0.1:5173`: 当前系统 `prefers-reduced-motion: reduce` 下动画降级生效，document/body horizontal overflow 均为 0。
  - Playwright `reducedMotion: no-preference` 检查: 生成按钮 hover、上传区域 hover、Prompt focus 均存在低成本 transform/shadow/transition 反馈，document/body horizontal overflow 均为 0。

## 2026-06-01 多端响应式适配增强

- 操作模型ID: GPT-5 Codex
- 范围: 使用 `adapt` skill 对当前 Vue/Tailwind 前端做响应式视觉和不同屏幕尺寸下的 UI 稳定性增强；未修改业务逻辑、接口、状态管理、数据结构、store、service、types、上传/生成/历史/API Key 行为；保持现有页面信息架构、组件层级和桌面端三栏布局分配。
- 修改内容:
  - `src/style.css`: 增加全局 `overflow-x` 防护、媒体元素最大宽度、核心容器 `min-width: 0`、长 Prompt/URL/错误/提示文本的 `overflow-wrap` 防护、结果网格基于容器宽度的自适应列宽、移动/平板下历史列表取消嵌套横向风险。
  - `src/pages/Workbench.vue`: 保持三栏结构不变，补充顶栏标题和卡片区域的窄屏宽度约束，并让移动端卡片内边距更稳。
  - `src/components/GenerationForm.vue`: 优化 Prompt 错误换行、数量步进器和重置按钮在移动/平板下的触控尺寸。
  - `src/components/ApiKeyInput.vue`: 优化密钥输入框内嵌按钮、连接测试按钮、连接状态和记住密钥提示在窄屏下的换行与点击区域。
  - `src/components/ReferenceImages.vue`、`src/components/MaskImageInput.vue`: 优化上传区、URL 输入/添加/确认、长 URL 预览和移除按钮在移动/平板下的排布与可点击区域。
  - `src/components/ResultGrid.vue`、`src/components/HistoryPanel.vue`: 优化结果区头部、结果操作按钮、错误/警告文本、历史搜索/日期输入、历史项按钮和图片弹窗在不同视口下的稳定性。
- 验证:
  - `npm run build`: passed。
  - `npm test`: 26 files / 434 tests passed。
  - `npm run test:e2e`: 16 tests passed。
  - 内置浏览器检查 `1280x720`: document/body horizontal overflow 均为 0。
  - Playwright 多视口长文本检查 `320x780`、`390x844`、`768x1024`、`1024x768`、`1440x900`: 注入长 Prompt、长 URL、长 Mask URL 后 `documentOverflowX` 均为 0，核心三段区域无重叠、无水平越界元素。
  - 截图产物: `test-results/adapt-mobile-320.png`、`test-results/adapt-tablet-768.png`、`test-results/adapt-desktop-1440.png` 等本地验证截图。

## 2026-06-01 UI 最终视觉润色

- 操作模型ID: GPT-5 Codex
- 范围: 使用 `polish` skill，并按其要求参考 `frontend-design` 原则，对当前 Vue/Tailwind 前端做最终视觉细节润色；未修改 store、service、types、API 请求逻辑、状态管理、数据结构或核心功能行为；未调整页面主要三栏布局分配。
- 修改内容:
  - `src/style.css`: 补充统一的 studio 视觉 token、卡片/顶栏表面阴影、控件最小高度、按钮 focus-visible/active/disabled 状态、空/加载状态背景、历史与结果项 hover 质感、移动端控件高度和 `prefers-reduced-motion` 处理。
  - `src/pages/Workbench.vue`: 在不改变三栏结构的前提下补充 `min-w-0` 溢出防护，并统一生成按钮最小高度。
  - `src/components/GenerationForm.vue`: 优化数量步进器、计数显示和重置按钮的触控尺寸与对齐。
  - `src/components/ApiKeyInput.vue`: 优化密钥输入内嵌图标按钮、连接测试按钮和记住密钥复选框尺寸。
  - `src/components/ReferenceImages.vue`、`src/components/MaskImageInput.vue`: 优化上传、URL 添加/确认、移除按钮的尺寸和居中。
  - `src/components/ResultGrid.vue`、`src/components/HistoryPanel.vue`: 优化结果操作按钮、历史搜索/日期输入、历史项操作按钮、加载更多和图片预览弹窗按钮的视觉一致性。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - Playwright CLI 桌面截图检查 `1280x800`: 三栏分配保持不变，未发现文字遮挡或水平溢出。
  - Playwright CLI 移动全页截图检查 `375x812`: 页面按原结构纵向堆叠，未发现文字溢出、遮挡或横向滚动。
  - 内置浏览器运行检查: document/body horizontal overflow 均为 0。


## 2026-05-31 Bug 审查 Findings 修复

- 操作模型ID: GPT-5 Codex
- 范围: 按代码审查 Findings 修复安全、请求、存储、校验和测试问题；未部署。
- 修复内容:
  - `src/services/image-api.ts`: 三类图片请求在 HTTP 200 body 含 `error` 时一律按失败处理；错误分类显式传入当前 API Key 做脱敏。
  - `src/services/connection-test.ts`: 连接测试同样识别 HTTP 200 body 含 `error`，并对 HTTP/网络错误显式脱敏当前 API Key。
  - `src/types/errors.ts`: 扩展脱敏逻辑，支持显式 secret、`sk-` 下划线/连字符格式、Bearer Token 和 key/token/secret/password 字段。
  - `src/stores/api-key.ts`: `VITE_REMEMBER_KEY_ENABLED=false` 时不恢复旧 localStorage API Key、不写入 localStorage，并清理旧 remember 偏好。
  - `src/stores/generation.ts`: 阻断无遮罩参考图、local 图搭配 mask URL、URL 图搭配本地 mask 文件等来源混用冲突；未知异常 debugHint 显式脱敏当前 API Key。
  - `src/components/HistoryPanel.vue`: 修复历史大图预览每次渲染创建 object URL 且不释放的问题，关闭弹窗、刷新历史和卸载组件时释放 URL。
  - `e2e/app.spec.ts`: Sub2API origin 断言改为从环境配置读取；测试 API Key 改为非 `sk-` 示例；新增桌面/平板无水平溢出和主要区域不重叠检查，移动端验证控件可滚动进入视口并可点击。
  - 补充 Vitest 覆盖: HTTP 200 body error、非标准 API Key 脱敏、remember 禁用、mask 来源冲突、连接测试 200 error。
- 验证:
  - `npm.cmd test -- --run`: 26 files / 419 tests passed。
  - `npm.cmd run build`: passed。
  - `npm.cmd run test:e2e`: 16 tests passed。

## 2026-05-31 Bug 审查追加修复

- 操作模型ID: GPT-5 Codex
- 范围: 按代码审查建议修复 API Key 存储泄露、URL 校验、Playwright 产物跟踪和 E2E 误判风险；未推进任务清单，未部署。
- 修复内容:
  - `src/stores/generation.ts`: 在当前结果态和 IndexedDB 历史写入前，对 prompt 与 revisedPrompt 使用当前 API Key 做显式脱敏，避免用户输入或上游 revised_prompt 回显密钥后进入历史、导出或后续展示链路。
  - `src/__tests__/stores/generation.test.ts`: 新增 prompt/revised_prompt 含当前 API Key 时的脱敏回归测试，覆盖 currentResults 与 IndexedDB history。
  - `src/services/image-api.ts`: `validateImageUrl` 新增凭据 URL、localhost、loopback、私网 IPv4、link-local/metadata host、IPv6 localhost/本地地址拒绝逻辑，降低 URL 参考图触发内网访问或凭据外泄风险。
  - `src/__tests__/services/image-api.test.ts`: 新增本地、私网、metadata、IPv6 localhost 与 userinfo URL 的拒绝用例。
  - `playwright.config.ts`: 将通过用例截图从 `on` 改为 `only-on-failure`，避免每次 E2E 把截图产物写入工作区。
  - `.gitignore`: 忽略 `test-results` 与 `playwright-report`。
  - Git 跟踪: 使用 `git rm -r --cached test-results` 将已跟踪的 Playwright 运行产物移出版本控制。
  - `e2e/app.spec.ts`: API Key 安全用例改为捕获所有带 Authorization 的请求，并断言它们全部发往配置的 Sub2API origin，同时覆盖连接测试 `/v1/models` 与图片接口路径。
- 验证:
  - `npm test`: 26 files / 431 tests passed。
  - `npm run build`: passed。
  - `npm run test:e2e`: 16 tests passed。

## 2026-05-31 部署前审查 Findings 修复

- 操作模型ID: GPT-5 Codex
- 范围: 按发布负责人部署前审查 Findings 修复交付文档、部署目标说明和部署后验证入口；未部署，未推进任务清单。
- 已确认部署信息:
  - 正式前端域名: `https://image.uxde.de`
  - 部署平台: Cloudflare Pages
  - Sub2API 后端: `https://uxde.de`
  - Sub2API CORS: `CORS_ALLOWED_ORIGINS=https://image.uxde.de`，`CORS_ALLOW_CREDENTIALS=false`
- 修复内容:
  - `README.md`: 替换 Vite 模板内容，补充项目定位、Cloudflare Pages 构建配置、生产环境变量、Sub2API CORS、运行/测试/构建/预览命令、API Key 存储策略、IndexedDB 本地历史边界和部署后冒烟测试清单。
  - `playwright.config.ts`: 支持 `PLAYWRIGHT_BASE_URL` 覆盖默认本地 `baseURL`；当目标不是本地开发服务时不启动 Playwright 内置 webServer。
  - `scripts/run-e2e.mjs`: 支持设置 `PLAYWRIGHT_BASE_URL=https://image.uxde.de` 后复用 E2E 验证正式站点；未设置时仍自动启动本地 Vite 服务。
- 验证:
  - `npm test`: 26 files / 431 tests passed。
  - `npm run build`: passed。
  - `npm run test:e2e`: 16 tests passed。
  - 构建产物扫描: 未发现真实 API Key、测试 API Key、测试响应或测试图片文件；`Authorization`、`Bearer`、`b64_json` 为运行时请求字段，`localhost` 为 URL 安全校验文本。
- 后续:
  - 部署到 Cloudflare Pages 后执行正式域名冒烟测试和 CORS 验证。

## 2026-05-31 部署前审查 Findings 闭环复核

- 操作模型ID: GPT-5 Codex
- 范围: 按发布负责人部署前审查 Findings 做发布前闭环复核；未部署，未推进任务清单。
- 复核内容:
  - Git 工作区在本次记录追加前已确认无待提交源码变更，避免 Cloudflare Pages Git 集成部署时出现本地审查版本与线上构建版本不一致。
  - `git ls-files -- 'test-results/*'` 无输出，确认 Playwright 运行产物已不再被版本控制跟踪。
  - `.gitignore` 已覆盖 `dist`、`test-results`、`playwright-report`；当前 `test-results/.last-run.json` 为被忽略的本地测试产物。
  - 生产配置、部署平台、Sub2API Base URL、正式域名和 CORS 说明沿用 README 与环境文件中的发布配置，未发现新的部署阻断项。
- 验证:
  - `npm.cmd test -- --run`: 26 files / 431 tests passed。
  - `npm.cmd run build`: passed。
  - `npm.cmd run test:e2e`: 16 tests passed。

## 2026-06-01 尺寸选择器选项更新

- 操作模型ID: GPT-5 Codex
- 范围: 按用户要求更新图片生成尺寸下拉选项，默认尺寸改为自动。
- 修改内容:
  - `src/types/generation.ts`: 新增 `auto`、1K/2K/4K 全部指定尺寸枚举，新增 `IMAGE_SIZE_OPTIONS` 中文显示标签，默认尺寸改为 `auto`。
  - `src/components/GenerationForm.vue`: 尺寸下拉改为展示“自动”和带分辨率说明的中文选项。
  - `src/__tests__/generation-types.test.ts`: 覆盖新增尺寸合法性、默认值和中文标签。
  - `src/__tests__/components/GenerationForm.test.ts`: 覆盖尺寸下拉 value 与中文 label。
  - `src/__tests__/stores/generation-params.test.ts`: 更新默认尺寸与 reset 断言。
- 验证:
  - `npm.cmd test -- --run src/__tests__/generation-types.test.ts src/__tests__/stores/generation-params.test.ts src/__tests__/components/GenerationForm.test.ts`: 3 files / 74 tests passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run build`: passed。
  - `npx.cmd --yes --package @playwright/cli playwright-cli snapshot`: 本地预览页尺寸下拉默认选中“自动”，并展示全部 10 个尺寸选项；已验证可选择 `3840x2160`。
  - `npm.cmd run test:e2e`: 16 tests passed。

## 2026-06-01 UI 视觉现代化优化

- 操作模型ID: GPT-5 Codex
- 范围: 使用 `frontend-design` skill 对现有 Vue/Tailwind 工作台做纯视觉优化；保持技术栈、组件层级、页面信息架构、业务逻辑、接口、状态管理和数据结构不变。
- 修改内容:
  - `src/style.css`: 新增浅色工业摄影工作台视觉系统，包含暖白网格背景、细腻径向光、卡片表面、顶部栏、主按钮、表单控件、焦点态、滚动条和通用交互过渡。
  - `src/pages/Workbench.vue`: 保持三栏布局结构不变，替换页面背景、顶部栏、卡片容器和生成按钮视觉样式。
  - `src/components/GenerationForm.vue`: 优化参数表单的层级、间距、输入框、选择器、数量步进器和重置按钮质感。
  - `src/components/ApiKeyInput.vue`: 优化密钥输入区、连接测试按钮、连接状态、记住密钥提示和交互状态。
  - `src/components/ReferenceImages.vue`、`src/components/MaskImageInput.vue`: 优化上传区域、URL 输入、预览项、警告/错误状态和按钮样式。
  - `src/components/ResultGrid.vue`、`src/components/HistoryPanel.vue`: 优化空状态、加载态、结果卡片、历史搜索、历史记录项、弹窗和操作按钮视觉表现。
- 验证:
  - `npm.cmd run build`: passed。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - Playwright CLI 桌面检查 `1280x800`: document/body horizontal overflow 均为 0，主要区域无重叠。
  - Playwright CLI 移动检查 `375x812`: document/body horizontal overflow 均为 0，核心区域纵向堆叠正常，生成按钮宽度 351px，无文字溢出。
