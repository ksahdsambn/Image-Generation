import { expect, test, type Page } from '@playwright/test'

const apiHost = 'https://sub2api.example.com'
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='

async function mockGeneration(page: Page, status = 200) {
  await page.route(`${apiHost}/v1/images/generations`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body:
        status === 200
          ? JSON.stringify({ data: [{ b64_json: tinyPngBase64 }] })
          : JSON.stringify({ error: 'bad key' }),
    })
  })
}

async function fillSuccessfulRequest(page: Page, prompt = 'Workflow history image') {
  await page.getByLabel('Sub2API API Key').fill('sk-workflow-secret')
  await page.getByLabel('Prompt').fill(prompt)
  await page.getByRole('button', { name: 'Generate' }).click()
}

test('does not allow generation without an API Key', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith(apiHost)) {
      requests.push(request.url())
    }
  })

  await page.goto('/')
  await page.getByLabel('Prompt').fill('No key request')

  await expect(page.getByRole('button', { name: 'Generate' })).toBeDisabled()
  expect(requests).toEqual([])
})

test('shows auth errors and does not write failed requests to history', async ({ page }) => {
  await mockGeneration(page, 401)
  await page.goto('/')

  await fillSuccessfulRequest(page, 'Rejected key image')

  await expect(page.getByText('API Key 无效或已失效')).toBeVisible()
  await expect(page.getByText('No local images yet.')).toBeVisible()
})

test('saves successful generations to history and restores them after refresh', async ({ page }) => {
  await mockGeneration(page)
  await page.goto('/')

  await fillSuccessfulRequest(page, 'Workflow history image')

  await expect(page.getByAltText(/Generated image/)).toBeVisible()
  await expect(page.getByText('Workflow history image')).toBeVisible()

  await page.reload()

  await expect(page.getByText('Workflow history image')).toBeVisible()
})

test('deletes generated history records', async ({ page }) => {
  await mockGeneration(page)
  await page.goto('/')

  await fillSuccessfulRequest(page, 'Delete history image')
  await expect(page.getByText('Delete history image')).toBeVisible()

  await page.getByRole('button', { name: /Delete / }).click()

  await expect(page.getByText('No local images yet.')).toBeVisible()
})
