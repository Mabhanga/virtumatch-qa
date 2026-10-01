import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});