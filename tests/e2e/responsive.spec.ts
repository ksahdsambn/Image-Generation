import { expect, test, type Page } from '@playwright/test'

const apiHost = 'https://sub2api.example.com'
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='

async function mockSuccessfulGeneration(page: Page) {
  await page.route(`${apiHost}/v1/images/generations`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ b64_json: tinyPngBase64 }] }),
    })
  })
}

async function attachScreenshot(page: Page, name: string) {
  const screenshot = await page.screenshot({ fullPage: true })
  await test.info().attach(name, {
    body: screenshot,
    contentType: 'image/png',
  })
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1)
}

async function expectAllButtonsNamed(page: Page) {
  const unnamedButtons = await page.locator('button').evaluateAll((buttons) =>
    buttons
      .map((button, index) => ({
        index,
        text: button.textContent?.trim() ?? '',
        ariaLabel: button.getAttribute('aria-label') ?? '',
        title: button.getAttribute('title') ?? '',
      }))
      .filter((button) => !button.text && !button.ariaLabel && !button.title),
  )

  expect(unnamedButtons).toEqual([])
}

test('desktop layout has no obvious overflow and all icon buttons are named', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')

  await expect(page.getByText('Generation parameters')).toBeVisible()
  await expect(page.getByText('Current results')).toBeVisible()
  await expect(page.getByText('Local history')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expectAllButtonsNamed(page)
  await attachScreenshot(page, 'desktop-layout.png')
})

test('tablet layout keeps primary controls visible without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.goto('/')

  await expect(page.getByLabel('Sub2API API Key')).toBeVisible()
  await expect(page.getByLabel('Prompt')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expectAllButtonsNamed(page)
  await attachScreenshot(page, 'tablet-layout.png')
})

test('mobile layout supports the core generate, history, and download flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockSuccessfulGeneration(page)
  await page.goto('/')

  await page.getByLabel('Sub2API API Key').fill('sk-mobile-secret')
  await page.getByLabel('Prompt').fill('Mobile layout flow')
  await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled()
  await page.getByRole('button', { name: 'Generate' }).click()

  await expect(page.getByAltText(/Generated image/)).toBeVisible()
  await expect(page.getByText('Mobile layout flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expectAllButtonsNamed(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download gpt-image-2-/ }).first().click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/gpt-image-2-.*\.png/)

  await attachScreenshot(page, 'mobile-layout.png')
})
