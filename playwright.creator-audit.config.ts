import { defineConfig, devices } from '@playwright/test';

/** Ad-hoc creator UX audit — writes review screenshots (not baselines). */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /creator-ux-audit\.pw\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [['list']],
  outputDir: '.creator-audit-screenshots/test-results',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
