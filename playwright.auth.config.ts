import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

const AUTH_STORAGE = 'tests/visual/.auth/user.json';

/**
 * Playwright config for authenticated visual + a11y baselines (TASK-385).
 * Uses a one-time login (auth.setup.ts) and reuses storageState for all specs.
 */
export default defineConfig({
  ...baseConfig,
  testMatch: undefined,
  testIgnore: undefined,
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'auth-chromium',
      testMatch: /auth-(screenshots|a11y)\.pw\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STORAGE,
      },
    },
  ],
});
