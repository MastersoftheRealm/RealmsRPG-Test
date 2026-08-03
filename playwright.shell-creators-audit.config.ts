/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Screenshot + chrome audit for the six CreatorPageShell standalone creators (TASK-380/431).
 * CI: wired in ui-verify.yml (~1–2 min on Linux after build; 8 tests, workers=1).
 * Local: `npm run verify:shell-creators-audit` (builds first).
 */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /shell-creators-audit\.pw\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  outputDir: '.shell-creators-audit/test-results',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    // Never reuse a stray server — always serve the build under test (matches playwright.config.ts).
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
