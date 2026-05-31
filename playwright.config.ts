import { defineConfig } from '@playwright/test'

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
const defaultBaseUrl = 'http://127.0.0.1:5173'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseUrl
const useExternalBaseUrl = baseURL !== defaultBaseUrl

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: skipWebServer || useExternalBaseUrl
    ? undefined
    : {
        command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1',
        url: defaultBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
})
