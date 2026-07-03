import { defineConfig, devices } from '@playwright/test';

/** Chip unification baselines — allows reusing an existing server on :3000 (e.g. after `npm run build && npm run start`). */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /chip-unification\.pw\.ts/,
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
