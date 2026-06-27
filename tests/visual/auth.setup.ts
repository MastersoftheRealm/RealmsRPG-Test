import { test as setup } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { AUTH_STORAGE_PATH, hasAuthCredentials, loginAsTestUser } from './auth-fixture';

setup('authenticate', async ({ page }, testInfo) => {
  if (!hasAuthCredentials()) {
    testInfo.skip(true, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD (DEV-003)');
    return;
  }

  mkdirSync(dirname(AUTH_STORAGE_PATH), { recursive: true });
  await loginAsTestUser(page);
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
