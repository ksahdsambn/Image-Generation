import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const MOCK_B64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const TEST_API_KEY = 'test-api-key-1234567890'
const BAD_TEST_API_KEY = 'bad-test-api-key'
const EXPECTED_SUB2API_ORIGIN = getExpectedSub2ApiOrigin()

function getExpectedSub2ApiOrigin(): string {
  const configuredBaseUrl = process.env.VITE_SUB2API_BASE_URL
    ?? readEnvValue('VITE_SUB2API_BASE_URL', '.env.local')
    ?? readEnvValue('VITE_SUB2API_BASE_URL', '.env')
    ?? readEnvValue('VITE_SUB2API_BASE_URL', '.env.production')

  if (!configuredBaseUrl) {
    throw new Error('Missing VITE_SUB2API_BASE_URL for E2E origin assertion')
  }

  return new URL(configuredBaseUrl).origin
}

function readEnvValue(key: string, fileName: string): string | undefined {
  const envPath = path.join(process.cwd(), fileName)
  if (!fs.existsSync(envPath)) return undefined
  const line = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`))
  if (!line) return undefined
  return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentScrollWidth: document.documentElement.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
  }))
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1)
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 1)
}

async function expectTestIdsDoNotOverlap(page: Page, testIds: string[]) {
  const overlaps = await page.evaluate((ids) => {
    const boxes = ids.map((id) => {
      const element = document.querySelector(`[data-testid="${id}"]`)
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { id, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
    }).filter((box): box is NonNullable<typeof box> => box !== null)

    const result: string[] = []
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]
        const b = boxes[j]
        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
        if (xOverlap > 1 && yOverlap > 1) {
          result.push(`${a.id}/${b.id}`)
        }
      }
    }
    return result
  }, testIds)
  expect(overlaps).toEqual([])
}

async function setupMockApi(page: Page, options?: {
  status?: number
  body?: Record<string, unknown>
}) {
  const status = options?.status ?? 200
  const body = options?.body ?? {
    data: [{ b64_json: MOCK_B64_PNG }],
  }

  await page.route('**/v1/images/**', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function setupMockModelsApi(page: Page, options?: {
  status?: number
}) {
  await page.route('**/v1/models', async (route) => {
    await route.fulfill({
      status: options?.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: 'gpt-image-2' }] }),
    })
  })
}

test.describe('E2E: 主流程验证', () => {
  test('无 API Key 时不允许提交', async ({ page }) => {
    await page.goto('/')
    const generateBtn = page.getByTestId('generate-btn')
    await expect(generateBtn).toBeDisabled()
  })

  test('输入 API Key 后生成按钮仍需 Prompt', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    const generateBtn = page.getByTestId('generate-btn')
    await expect(generateBtn).toBeDisabled()
  })

  test('错误 API Key 显示认证错误', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page, { status: 401, body: { error: { message: 'Invalid API key', type: 'invalid_request_error', code: 'invalid_api_key' } } })
    await page.getByTestId('api-key-input').fill(BAD_TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    const generateBtn = page.getByTestId('generate-btn')
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()
    await expect(page.getByTestId('error-state')).toBeVisible()
    await expect(page.getByTestId('error-state')).toContainText(/API Key|密钥|认证/)
  })

  test('模拟成功文生图后图片可预览并进入历史', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    const generateBtn = page.getByTestId('generate-btn')
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()
    await expect(page.getByTestId('loading-state')).toBeVisible()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('result-images').locator('img')).toBeVisible()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 5000 })
  })

  test('失败请求不写历史', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page, { status: 500, body: { error: { message: 'Internal server error', type: 'server_error' } } })
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('history-empty')).toBeVisible()
  })

  test('刷新页面后 IndexedDB 历史仍可查看', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 10000 })
    await page.reload()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 5000 })
  })

  test('删除历史记录生效', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 10000 })
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })
    await page.getByTestId('delete-history-btn').first().click()
    await expect(page.getByTestId('history-empty')).toBeVisible({ timeout: 5000 })
  })

  test('清空全部历史生效', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 10000 })
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })
    await page.getByTestId('clear-all-btn').click()
    await expect(page.getByTestId('history-empty')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('E2E: 连接状态检查', () => {
  test('连接测试成功显示连接正常', async ({ page }) => {
    await page.goto('/')
    await setupMockModelsApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('test-connection-btn').click()
    await expect(page.getByTestId('connection-ok')).toBeVisible({ timeout: 5000 })
  })

  test('连接测试失败显示错误', async ({ page }) => {
    await page.goto('/')
    await setupMockModelsApi(page, { status: 401 })
    await page.getByTestId('api-key-input').fill(BAD_TEST_API_KEY)
    await page.getByTestId('test-connection-btn').click()
    await expect(page.getByTestId('connection-error')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('E2E: API Key 安全', () => {
  test('API Key 只发送到配置的 Sub2API 后端', async ({ page }) => {
    await page.goto('/')
    const interceptedUrls: string[] = []
    const authorizedUrls: string[] = []
    page.on('request', (request) => {
      const authorization = request.headers().authorization
      if (authorization) {
        authorizedUrls.push(request.url())
      }
    })
    await page.route('**/v1/images/**', async (route) => {
      interceptedUrls.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ b64_json: MOCK_B64_PNG }] }),
      })
    })
    await setupMockModelsApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('test-connection-btn').click()
    await expect(page.getByTestId('connection-ok')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('prompt-input').fill('test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    expect(interceptedUrls.length).toBeGreaterThan(0)
    for (const url of interceptedUrls) {
      expect(new URL(url).origin).toBe(EXPECTED_SUB2API_ORIGIN)
    }
    expect(authorizedUrls.length).toBeGreaterThanOrEqual(2)
    for (const url of authorizedUrls) {
      expect(new URL(url).origin).toBe(EXPECTED_SUB2API_ORIGIN)
    }
  })
})

test.describe('E2E: 桌面端布局', () => {
  test('桌面端无明显布局重叠', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.getByTestId('api-key-area')).toBeVisible()
    await expect(page.getByTestId('generation-form')).toBeVisible()
    await expect(page.getByTestId('result-grid')).toBeVisible()
    await expect(page.getByTestId('history-panel')).toBeVisible()
    await expect(page.getByTestId('generate-btn')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectTestIdsDoNotOverlap(page, ['generation-form', 'result-grid', 'history-panel'])
  })
})

test.describe('E2E: 移动端布局', () => {
  test('移动端核心流程可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await setupMockApi(page)
    await expect(page.getByTestId('api-key-input')).toBeVisible()
    await expect(page.getByTestId('prompt-input')).toBeVisible()
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('mobile test')
    const generateBtn = page.getByTestId('generate-btn')
    await generateBtn.scrollIntoViewIfNeeded()
    await expect(generateBtn).toBeInViewport()
    await generateBtn.click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    await expectNoHorizontalOverflow(page)
  })
})

test.describe('E2E: 平板布局', () => {
  test('平板端布局正常', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')
    await expect(page.getByTestId('api-key-area')).toBeVisible()
    await expect(page.getByTestId('generation-form')).toBeVisible()
    await expect(page.getByTestId('result-grid')).toBeVisible()
    await expect(page.getByTestId('history-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectTestIdsDoNotOverlap(page, ['generation-form', 'result-grid', 'history-panel'])
  })
})

test.describe('E2E: CORS 和网络错误', () => {
  test('CORS 失败显示跨域配置提示', async ({ page }) => {
    await page.goto('/')
    await page.route('**/v1/images/**', async (route) => {
      await route.abort('failed')
    })
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 10000 })
    const errorText = await page.getByTestId('error-state').textContent()
    expect(errorText).toMatch(/无法连接|跨域|网络/)
  })
})

test.describe('E2E: 模拟大图响应', () => {
  test('大图可预览', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill(TEST_API_KEY)
    await page.getByTestId('prompt-input').fill('large image test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    const img = page.getByTestId('result-images').locator('img').first()
    await expect(img).toBeVisible()
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  })
})
