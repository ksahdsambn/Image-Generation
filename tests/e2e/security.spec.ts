import { expect, test, type Page } from '@playwright/test'

const apiHost = 'https://sub2api.example.com'
const secret = 'sk-e2e-secret'
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='

async function fillRequiredFields(page: Page) {
  await page.getByLabel('Sub2API API Key').fill(secret)
  await page.getByLabel('Prompt').fill('Security boundary test image')
}

async function readIndexedDbSnapshot(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('gpt-image-2-local-gallery')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    const stores = Array.from(db.objectStoreNames)
    const result: Record<string, unknown[]> = {}

    await Promise.all(
      stores.map(
        (storeName) =>
          new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly')
            const request = transaction.objectStore(storeName).getAll()
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
              result[storeName] = request.result
              resolve()
            }
          }),
      ),
    )

    db.close()
    return result
  })
}

test('API Key is only sent to configured Sub2API and is not stored in image history', async ({ page }) => {
  const consoleMessages: string[] = []
  const authorizedUrls: string[] = []

  page.on('console', (message) => {
    consoleMessages.push(message.text())
  })

  page.on('request', (request) => {
    if (request.headers().authorization) {
      authorizedUrls.push(request.url())
    }
  })

  await page.route(`${apiHost}/v1/images/generations`, async (route) => {
    const request = route.request()
    expect(request.headers().authorization).toBe(`Bearer ${secret}`)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ b64_json: tinyPngBase64 }] }),
    })
  })

  await page.goto('/')
  await fillRequiredFields(page)
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByAltText(/Generated image/)).toBeVisible()

  expect(authorizedUrls).toEqual([`${apiHost}/v1/images/generations`])

  const storage = await page.evaluate(() => ({
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
  }))
  const localStorageText = JSON.stringify(storage.localStorage)
  const sessionStorageText = JSON.stringify(storage.sessionStorage)
  const indexedDbText = JSON.stringify(await readIndexedDbSnapshot(page))
  const consoleText = consoleMessages.join('\n')

  expect(localStorageText).not.toContain(secret)
  expect(localStorageText).not.toContain(tinyPngBase64)
  expect(localStorageText).not.toContain('data:image')
  expect(sessionStorageText).toContain(secret)
  expect(indexedDbText).not.toContain(secret)
  expect(indexedDbText).not.toContain('Authorization')
  expect(indexedDbText).not.toContain('Bearer')
  expect(consoleText).not.toContain(secret)
  expect(consoleText).not.toContain('Authorization')
  expect(consoleText).not.toContain(tinyPngBase64)
})

test('failed requests keep sensitive values out of visible errors and console output', async ({ page }) => {
  const consoleMessages: string[] = []

  page.on('console', (message) => {
    consoleMessages.push(message.text())
  })

  await page.route(`${apiHost}/v1/images/generations`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: `Authorization: Bearer ${secret}` }),
    })
  })

  await page.goto('/')
  await fillRequiredFields(page)
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByText('API Key 无效或已失效')).toBeVisible()

  const pageText = await page.locator('body').innerText()
  const consoleText = consoleMessages.join('\n')

  expect(pageText).not.toContain(secret)
  expect(pageText).not.toContain('Authorization')
  expect(consoleText).not.toContain(secret)
  expect(consoleText).not.toContain('Authorization')
})
