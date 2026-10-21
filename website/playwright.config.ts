import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
// Prefer installed Chrome when available; otherwise use Playwright's Chromium.
const systemChrome = process.platform === 'darwin' && existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 30000,
  retries: 0,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    channel: process.env.PLAYWRIGHT_CHANNEL || (systemChrome ? 'chrome' : undefined),
    trace: 'retain-on-failure', screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 30000
  }
})
