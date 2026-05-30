import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    env: {
      VITE_SUB2API_BASE_URL: 'https://sub2api.example.com',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
})
