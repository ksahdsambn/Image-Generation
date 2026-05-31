import { test, expect, type Page } from '@playwright/test'

const MOCK_B64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    const generateBtn = page.getByTestId('generate-btn')
    await expect(generateBtn).toBeDisabled()
  })

  test('错误 API Key 显示认证错误', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page, { status: 401, body: { error: { message: 'Invalid API key', type: 'invalid_request_error', code: 'invalid_api_key' } } })
    await page.getByTestId('api-key-input').fill('sk-wrong-key')
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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('history-empty')).toBeVisible()
  })

  test('刷新页面后 IndexedDB 历史仍可查看', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('prompt-input').fill('a cute cat')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 10000 })
    await page.reload()
    await expect(page.getByTestId('history-item')).toBeVisible({ timeout: 5000 })
  })

  test('删除历史记录生效', async ({ page }) => {
    await page.goto('/')
    await setupMockApi(page)
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('test-connection-btn').click()
    await expect(page.getByTestId('connection-ok')).toBeVisible({ timeout: 5000 })
  })

  test('连接测试失败显示错误', async ({ page }) => {
    await page.goto('/')
    await setupMockModelsApi(page, { status: 401 })
    await page.getByTestId('api-key-input').fill('sk-wrong-key')
    await page.getByTestId('test-connection-btn').click()
    await expect(page.getByTestId('connection-error')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('E2E: API Key 安全', () => {
  test('API Key 只发送到配置的 Sub2API 后端', async ({ page }) => {
    await page.goto('/')
    const interceptedUrls: string[] = []
    await page.route('**/v1/images/**', async (route) => {
      interceptedUrls.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ b64_json: MOCK_B64_PNG }] }),
      })
    })
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('prompt-input').fill('test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    expect(interceptedUrls.length).toBeGreaterThan(0)
    for (const url of interceptedUrls) {
      expect(url).toMatch(/your-sub2api\.example\.com/)
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
  })
})

test.describe('E2E: 移动端布局', () => {
  test('移动端核心流程可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await setupMockApi(page)
    await expect(page.getByTestId('api-key-input')).toBeVisible()
    await expect(page.getByTestId('prompt-input')).toBeVisible()
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('prompt-input').fill('mobile test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
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
  })
})

test.describe('E2E: CORS 和网络错误', () => {
  test('CORS 失败显示跨域配置提示', async ({ page }) => {
    await page.goto('/')
    await page.route('**/v1/images/**', async (route) => {
      await route.abort('failed')
    })
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
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
    await page.getByTestId('api-key-input').fill('sk-test-key-1234567890')
    await page.getByTestId('prompt-input').fill('large image test')
    await page.getByTestId('generate-btn').click()
    await expect(page.getByTestId('result-images')).toBeVisible({ timeout: 10000 })
    const img = page.getByTestId('result-images').locator('img').first()
    await expect(img).toBeVisible()
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  })
})
