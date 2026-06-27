import { test, expect } from '@playwright/test';

import { THEMES, themeInit } from './targets';
import {
  buildAuthScreenshotPages,
  hasAuthCredentials,
  resolveAuthPathsFromEnv,
  screenshotMasks,
  waitForAuthPageReady,
  type AuthPageDef,
} from './auth-fixture';

/**
 * Authenticated visual baselines (TASK-385).
 * Requires storageState from auth.setup.ts (playwright.auth.config.ts).
 */
test.describe('authenticated surfaces · visual', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    if (!hasAuthCredentials()) {
      testInfo.skip(true, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD (DEV-003)');
    }
  });

  const paths = resolveAuthPathsFromEnv();
  const pages: AuthPageDef[] = buildAuthScreenshotPages(paths);

  for (const theme of THEMES) {
    for (const pageDef of pages) {
      test(`${pageDef.name} · ${theme}`, async ({ page, context }) => {
        await context.addInitScript(themeInit(theme), theme);
        await page.goto(pageDef.path, { waitUntil: 'load' });
        await waitForAuthPageReady(page, pageDef.name);

        await expect(page).toHaveScreenshot(`${pageDef.name}-${theme}.png`, {
          fullPage: true,
          mask: screenshotMasks(page, pageDef.name),
        });
      });
    }
  }
});
