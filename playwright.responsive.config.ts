/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Multi-width layout gate (ADR-0023 / TASK-831).
 * CI: wired in ui-verify.yml after the production build.
 * Local: `npm run verify:responsive` (builds first).
 */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /responsive-layout\.pw\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  ...(process.env.CI ? { workers: 2 } : {}),
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  outputDir: '.responsive-layout/test-results',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
    colorScheme: 'dark',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
