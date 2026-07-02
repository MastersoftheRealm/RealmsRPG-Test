import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the visual-regression + accessibility safety net.
 * ----------------------------------------------------------------------
 * - Spec files use the `*.pw.ts` suffix so the existing Vitest runner
 *   (`*.test.ts` in src/) never picks them up, and vice versa.
 * - Screenshots are captured against deterministic, data-free routes
 *   (styleguide, marketing, legal, auth) so baselines don't churn on data.
 * - Playwright ALWAYS launches its own `npm run start` (reuseExistingServer:
 *   false) so the suite can never silently test a stale, already-running server
 *   serving an older build. Always `npm run build` before running these specs.
 *
 * NOTE on baselines: Playwright stores OS-specific baselines. Baselines
 * generated on this (Windows) machine power the local/agent self-review loop;
 * CI (Linux) generates its own set on first run. See DEVELOPER_TASK_QUEUE.
 */
export default defineConfig({
  testDir: './tests/visual',
  testMatch: /.*\.pw\.ts/,
  testIgnore: [/auth-screenshots\.pw\.ts/, /auth-a11y\.pw\.ts/],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      // Absorb sub-pixel font/anti-aliasing noise; still catches real layout/color shifts.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    // Never reuse a stray server — always serve the build under test.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
