import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

const AUTH_STORAGE = 'tests/visual/.auth/user.json';

/**
 * Playwright config for authenticated visual + a11y baselines (TASK-385).
 * Uses a one-time login (auth.setup.ts) and reuses storageState for all specs.
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- omit base globs; projects set their own */
const { testMatch, testIgnore, ...authBase } = baseConfig;
/* eslint-enable @typescript-eslint/no-unused-vars */

export default defineConfig({
  ...authBase,
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
