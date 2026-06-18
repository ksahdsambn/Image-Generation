# 修复记录

## 2026-06-01 参考图可选标记

- 操作模型ID: GPT-5 Codex
- 范围: 按用户要求仅调整参考图区标题文案，明确参考图不是必填项；未修改上传逻辑、URL 输入逻辑、参数校验、请求构建、store、service、types 或数据结构。
- 修改内容:
  - `src/components/ReferenceImages.vue`: 将标题从 `参考图` 改为 `参考图 (可选)`，与现有 `遮罩图 (可选)` 标题格式保持一致。
- 验证:
  - `npm test -- src/__tests__/components/ReferenceImages.test.ts`: 1 file / 19 tests passed。
  - 内置浏览器检查 `http://127.0.0.1:5173/`: `参考图 (可选)` 与 `遮罩图 (可选)` 均可见。

## 2026-06-01 多数量生成拆分为单图请求
- 操作模型ID: GPT-5 Codex
- 范围: 保持 `/v1/images/generations` 与 `/v1/images/edits` 现有调用方式，不迁移 `/v1/responses`，仅调整前端请求构建、生成 store 流程、结果 loading 进度展示和相关测试；未修改 Sub2API 后端、API Key 管理、下载/复制/删除结果或历史清理功能。
- 修改内容:
  - `src/services/image-api.ts`: 文生图 JSON、本地参考图 multipart、网页 URL 参考图 JSON 的请求 body builder 均不再写入 `n` 字段，即使传入 `n > 1` 也保持单图请求体。
  - `src/stores/generation.ts`: 将一次 `generate()` 改为按用户选择数量顺序循环多次单图请求；每次复用同一 prompt、尺寸、质量、背景、输出格式和压缩参数；首张成功后替换旧结果，后续成功立即追加到当前结果并逐张写入历史，历史记录中的 `n` 仍记录用户选择的总数量。
  - `src/stores/generation.ts`: 新增 `completedCount`、`targetCount` 与 `loadingMessage`；首张失败保持原失败行为且不写历史，部分成功后失败会保留已成功图片并提示“已生成 X/N，剩余图片生成失败：...”
  - `src/components/ResultGrid.vue`: loading 文案改为使用 store 进度文案；已有结果继续生成时展示当前结果并在结果区顶部显示进度状态。
  - `src/stores/generation-params.ts`: 辅助请求体构建也不再包含 `n`，避免后续复用时误发多图参数。
- 测试覆盖:
  - `n=1` 只请求 1 次且请求体不包含 `n`。
  - `n=3` 顺序发 3 次单图请求，每次请求体不包含 `n`，成功后当前结果与历史记录均为 3 条。
  - 第 1 张成功、第 2 张失败时保留 1 张结果和 1 条历史，并显示部分失败提示；第 1 张失败时不写历史且不显示空结果。
  - 本地参考图编辑和网页 URL 参考图编辑在多数量模式下同样不发送 `n`。
- 验证:
  - 定向测试: `npm.cmd test -- --run src/__tests__/services/image-api.test.ts src/__tests__/stores/generation-params.test.ts src/__tests__/stores/generation.test.ts src/__tests__/components/ResultGrid.test.ts`: 4 files / 164 tests passed。
  - `npm.cmd run test`: 26 files / 446 tests passed。
  - `npm.cmd run build`: passed，CSS 69.36 kB / gzip 12.50 kB，JS 233.28 kB / gzip 79.67 kB。

## 2026-06-01 UI 体验与表现性能优化
- 操作模型ID: GPT-5 Codex
- 范围: 使用 `optimize` skill 对当前 Vue/Tailwind 前端仅做 UI 层面的加载体验、渲染效率、视觉反馈、动画性能、图片展示稳定性和交互流畅度优化；未修改生成逻辑、API 请求逻辑、上传逻辑、历史逻辑、密钥逻辑、store、service、types、数据结构、核心功能、三栏布局分配、移动端堆叠顺序或页面信息架构。
- 修改内容:
  - `src/style.css`: 降低全局阴影 token、顶栏 blur、卡片/结果区/按钮/弹窗/hover 状态的重阴影强度，保留现有视觉风格但减少重绘成本；为卡片、结果项、历史项和参考图预览增加 `contain: paint`，缩小重绘影响范围。
  - `src/style.css`: 将生成按钮从 Tailwind `transition-all` 改为受控的颜色、背景、边框、阴影、transform、opacity 过渡；继续使用 transform/opacity 类低成本动效，保持 `prefers-reduced-motion` 降级规则。
  - `src/style.css`: 优化输入 focus、上传区、空状态、加载态、结果卡片、历史项和移动端背景层的视觉反馈，让状态变化更轻、更稳；修正 320px 窄视口下 `body min-width` 与滚动条占宽导致的根元素横向溢出。
  - `src/components/ResultGrid.vue`、`src/components/ReferenceImages.vue`、`src/components/MaskImageInput.vue`、`src/components/HistoryPanel.vue`: 为结果图、参考图、遮罩图、历史缩略图补充稳定尺寸、`decoding="async"` 和必要的 `loading="lazy"`，减少图片加载前后的视觉跳动。
- 验证:
  - 基线构建: `npm.cmd run build` passed，CSS 68.85 kB / gzip 12.46 kB，JS 231.14 kB / gzip 78.87 kB。
  - 最终构建: `npm.cmd run build` passed，CSS 69.16 kB / gzip 12.52 kB，JS 231.35 kB / gzip 78.93 kB。
  - `npm.cmd test -- --run`: 26 files / 434 tests passed。
  - `npm.cmd run test:e2e`: 16 tests passed。
  - 内置浏览器响应式检查: 注入长 Prompt 和长 URL 后，`1440x900`、`768x1024`、`375x812`、`320x780` 的 document/body horizontal overflow 均为 0，visible overflow offenders 均为空。
  - 浏览器截图核对: `test-results/optimize-desktop-1440.png`、`test-results/optimize-mobile-375.png` 已生成，桌面三栏与移动端堆叠顺序保持不变，未发现文字遮挡、重叠或横向滚动。

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

## 2026-06-18 加入 Skill 系统基础能力

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 为生图站加入「Skill 规范」系统，生图前可将一段规范文本作为前缀拼接到用户 prompt 前面发给 API；默认关闭、手动开启；多个内置 skill 可选、拼接到 prompt 前缀。未改动三处 API builder、请求/响应解析、历史存储结构、环境变量与构建配置。
- 修改内容:
  - `src/types/skill.ts`（新增）: 内置 skill 清单 `SKILL_MANIFEST`（摄影写实/插画风格/电影质感）、类型、拼接常量 `SKILL_PROMPT_SEPARATOR`/`SKILL_USER_INPUT_LEAD`、`findSkillById`。
  - `src/services/skill-loader.ts`（新增）: 从 `public/skills/<filename>` fetch 读取 skill 文本，内存缓存，失败归类为网络错误。
  - `src/stores/skill.ts`（新增）: skill 状态与注入逻辑；`applySkillToPrompt()` 是唯一出口，未启用/未选择/内容缺失时严格原样返回用户输入。
  - `src/stores/generation.ts`: 注入点改造——区分 `rawPrompt`（校验+写历史）与 `finalPrompt`（发请求，含 skill 前缀），约 4 行核心改动。
  - `src/components/SkillSelector.vue`（新增）: 开关 + 下拉选择 UI。
  - `src/components/GenerationForm.vue`: 引入并渲染 `<SkillSelector />`。
  - `src/types/errors.ts`: 新增 `createNetworkError` 工厂函数（复用 `classifyNetworkError`）。
  - `public/skills/photography.md`、`illustration.md`、`cinematic.md`（新增）: 三个内置 skill 示范文件。
- 验证:
  - `npx vitest run`: 全量通过（新增 `src/__tests__/skill.test.ts` 13 个用例）。
  - `npx vue-tsc --noEmit`: 零错误。
  - `npx vite build`: passed，`dist/skills/` 下三个 .md 已正确输出到构建产物。

## 2026-06-18 自定义 Skill（IndexedDB 持久化 + 内联编辑）

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 在内置只读 skill 基础上，新增用户可自定义 skill：网页内联编辑（名称/简介/内容）、存 IndexedDB 持久化、刷新不丢；内置 skill 保持只读、可加自定义。未改 API 请求逻辑、生图注入格式。
- 修改内容:
  - `src/types/skill.ts`: 新增 `CustomSkillRecord`、`SkillOption`、`isCustomSkillId`、`CUSTOM_SKILL_ID_PREFIX`、`builtinSkillOptions()`；自定义 id 带 `custom-` 前缀与内置天然隔离。
  - `src/storage/database.ts`: DB v1→v2，新增 `customSkills` 表（`++pk, skillId, updatedAt`），保留 history 表平滑升级。
  - `src/storage/custom-skill-storage.ts`（新增）: 自定义 skill CRUD（list/get/save/delete），新增/更新/校验/软失败，复用 `classifyStorageError`。
  - `src/stores/skill.ts`: 合并内置+自定义双数据源（`allSkills` computed）；`applySkillToPrompt` 兼容两类；新增 `loadCustomSkills/startCreate/startEdit/cancelEdit/saveDraft/removeCustomSkill` 与编辑草稿状态 `draft`。
  - `src/components/SkillSelector.vue`: 下拉含内置（标注「（内置）」）+自定义；自定义列表行带 ✎ 编辑/🗑 删除（二次确认）；内联编辑区（名称* / 简介 / 规范内容* + 保存/取消）。
  - `src/main.ts`: 应用启动后异步加载自定义 skill 列表（不阻塞渲染）。
  - `src/__tests__/skill.test.ts`: 扩展为 17 个用例，覆盖双源注入、合并视图、编辑草稿。
  - `src/__tests__/storage/custom-skill-storage.test.ts`（新增）: 存储层 8 个用例。
- 验证:
  - `npx vitest run`: 全量通过。
  - `npx vue-tsc --noEmit`: 零错误。
  - `npx vite build`: passed。

## 2026-06-18 Skill 入口并入下拉框 + UI 微调

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 纯 UI/交互调整。将「新建 Skill」独立按钮并入下拉框、移除顶栏徽标、调整文案与字号；未改 skill 数据逻辑、存储、注入格式。
- 修改内容:
  - `src/types/skill.ts`: 新增常量 `SKILL_NEW_TRIGGER = '__new__'`，作为下拉框「自定义 Skill」入口项占位 value（store 不存储该值）。
  - `src/components/SkillSelector.vue`: 下拉框选项末尾新增「＋ 自定义 Skill」入口，选中时触发 `startCreate()` 并把 select 显示值恢复为当前实际选中项；删除原独立的「+ 新建 Skill」虚线按钮；移除入口上方的横线分隔项；开关标签「按 Skill 规范生图」改为「加载 Skill 规范」，label 字号由 `text-xs` 调大为 `text-sm`（比【尺寸】【质量】【输出格式】三项大一档）。
  - `src/pages/Workbench.vue`: 移除顶栏右侧「GPT Image Studio」徽标（含绿点与文字），顶栏仅保留左侧应用标题。
- 验证:
  - `npx vitest run`: 30 files / 488 tests passed。
  - `npx vue-tsc --noEmit`: 零错误。
  - `npx vite build`: passed，CSS 71.06 kB / gzip 12.87 kB，JS 393.63 kB / gzip 130.44 kB。

## 2026-06-19 前台多语言切换（i18n，5 种语言）

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 引入 `vue-i18n`，新增前台多语言切换，支持简体中文（zh-CN，默认/兜底）、English（en）、繁體中文（zh-TW）、日本語（ja）、한국어（ko）；自动检测浏览器语言 + localStorage 持久化用户选择；Skill 提示词内容（`public/skills/*.md`、`SKILL_MANIFEST` name/description、`SKILL_USER_INPUT_LEAD`）按用户选择**暂不国际化**（这些会作为 prompt 发给 API），保持出图稳定。
- 修改内容:
  - 新增翻译文件 `src/locales/{zh-CN,en,zh-TW,ja,ko}.ts`（约 170 个 key）+ `src/locales/index.ts`（语言清单 `SUPPORTED_LOCALES`、`messages` 汇总、`isSupportedLocale`）。
  - 新增 `src/i18n/index.ts`: `createI18n`（legacy:false，Composition 模式）、`detectInitialLocale`（localStorage → navigator.language 精确/前缀匹配，中文分支区分简繁 → 兜底 zh-CN）、`translateValidation`、`syncHtmlLang`。
  - 新增 `src/stores/locale.ts`: `currentLocale` computed 双向绑定全局 i18n、`setLocale`（同步 i18n + localStorage['gpt_image_2_locale'] + `<html lang>`），仿 `api-key.ts` 持久化模式。
  - 新增 `src/components/LocaleSwitcher.vue`: Globe 图标下拉切换器，挂在顶部工具栏右上角。
  - `src/main.ts`: 注册 i18n 插件，启动时 `syncHtmlLang()`。
  - 提取所有硬编码中文文案到 `t()`: 8 个 Vue 组件（ApiKeyInput/GenerationForm/ReferenceImages/MaskImageInput/ResultGrid/HistoryPanel/SkillSelector/Workbench）；`errors.ts`（`ERROR_MESSAGES` 改为 `errorMessage()` 按 locale 返回，动态 HTTP 错误改带参数 key `errors.HTTP_*_WITH_MSG`）；`image-api.ts`/`generation.ts`(store)/`skill.ts`/`custom-skill-storage.ts`/`storage-availability.ts`（返回 messageKey + 即时文案）/`history-writer.ts`/`config.ts`/`connection-test.ts`；`types/generation.ts` 的 `validatePrompt` + `IMAGE_SIZE_OPTIONS`（`label`→`labelKey`）。
  - `src/style.css`: 3 处 `aria-label="中文"` 选择器改为 `data-section`/`data-testid` 属性选择器（解耦样式与文案：`section[data-section="config"]`/`[data-section="result"]`、`[data-testid="history-search-btn"]`），避免 aria-label 国际化后样式失效。
  - HistoryPanel: `toLocaleString('zh-CN')` 改为 `toLocaleString(localeStore.currentLocale)`，切换语言日期格式随之变化；2 处原生 `confirm()` 改用 `t()`。
  - 测试: 新增 `src/__tests__/helpers/i18n.ts`（`createI18nForTest`）、`src/__tests__/locales.test.ts`（校验 5 语言 key 集合一致 + detectInitialLocale + locale store）、`src/__tests__/components/LocaleSwitcher.test.ts`；setup `setup-indexeddb.ts` 锁定全局 i18n 为 zh-CN 避免 jsdom `navigator.language`(en-US) 干扰断言；受影响组件测试均加 i18n 插件、更新断言（label→labelKey、aria-label 用 t() 解析）。
- 验证:
  - `npx vitest run`: 30 files / 488 tests passed（含 17 个新增 locale/switcher 测试，含跨语言 key 一致性校验防漏译）。
  - `npm run build`（vue-tsc -b + vite build）: passed。

## 2026-06-19 修复 Cloudflare Pages 部署失败（跨平台 lockfile）

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 多语言功能加入 `vue-i18n` 后，Cloudflare Pages `npm ci` 失败（`Missing: @emnapi/core@1.11.1` 等）。根因是 npm 跨平台原生可选依赖不兼容：本地 npm 11.6.2 / Node 24 / Windows 生成的 lockfile 只记录 Windows 平台原生依赖，**不记录 Linux 平台的**（`@emnapi/*` 来自 `@tailwindcss/oxide` 和 `rolldown` 的 Linux WASM 绑定），而 Cloudflare 是 npm 10.9.2 / Node 22 / Linux。经多次实验确认在 Windows 上无论 npm 11 还是 npm 10 都无法生成含 Linux 依赖的 lockfile。
- 修改内容（方案 B：Linux 环境生成 lockfile）:
  - 新增 `.github/workflows/sync-lockfile.yml`: 在 Ubuntu（Node 22）上 `npm install` 重新生成 lockfile（含 Linux 原生依赖），校验后自动 commit 并 push 回 main；触发方式为手动触发 + `package.json` 变动自动触发。
  - 新增 `.nvmrc`（内容 `22`）+ `package.json` 新增 `"engines": { "node": "22" }`: 锁定 Cloudflare / GitHub Actions / 本地三方都用 Node 22，杜绝版本漂移。
  - workflow 首次运行自动生成并 push 了 Linux-correct lockfile（commit `b4c1d49 chore: regenerate package-lock.json on Linux`）。
- 验证:
  - Cloudflare Pages 部署日志: `npm clean-install` 成功（`added 290 packages` / `found 0 vulnerabilities`），`npm run build` 通过（`✓ built in 726ms`），`Success: Your site was deployed!`。
  - 中间黄色 `[INVALID_ANNOTATION]` 是 `@vueuse/core` 的 `#__PURE__` 注释警告，与本项目代码无关、不影响功能。

## 2026-06-19 修复语言切换下拉框不显示

- 操作模型ID: ZCode (builtin:bigmodel-coding-plan/GLM-5.2)
- 范围: 上线后发现右上角语言切换下拉框无法显示。根因是 `.studio-topbar` 有 `overflow: hidden`（用于裁剪装饰性 `::before` 渐变条），而下拉框原本用 `position: absolute` 直接渲染在 topbar 内部，向下展开时超出 topbar 底边被裁掉。
- 修改内容:
  - `src/components/LocaleSwitcher.vue`: 下拉浮层改用 `<Teleport to="body">` 渲染到 `<body>` 下，绕开 topbar 的 overflow 限制；浮层 `position: fixed`，位置根据触发按钮 `getBoundingClientRect()` 动态计算钉在按钮正下方；`onClickOutside` 显式 `ignore: [triggerRef, panelRef]`（Teleport 后浮层在 rootRef 之外，否则点选项会先触发外部点击关闭）；监听 `window resize`，浮层打开时重新定位避免错位。
  - `src/__tests__/components/LocaleSwitcher.test.ts`: 适配 Teleport（jsdom 下定位不稳定，测试 stub teleport 只关注切换逻辑；保留 4 个用例覆盖打开/列出/切换/当前高亮）。
- 验证:
  - `npx vitest run`: 30 files / 488 tests passed。
  - `npm run build`: passed。
  - 已推送 commit `3dc2ca5`，Cloudflare 自动重新部署。

