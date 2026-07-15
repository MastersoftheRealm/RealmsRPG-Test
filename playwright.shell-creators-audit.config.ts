import { defineConfig, devices } from '@playwright/test';

/** Screenshot + chrome audit for the six CreatorPageShell standalone creators (TASK-380/431). */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /shell-creators-audit\.pw\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  reporter: [['list']],
  outputDir: '.shell-creators-audit/test-results',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
