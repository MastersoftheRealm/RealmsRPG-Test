import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { THEMES, themeInit } from './targets';
import {
  authA11yKeyFor,
  buildAuthScreenshotPages,
  hasAuthCredentials,
  isAuthA11yUpdateMode,
  loadAuthA11yBaseline,
  recordAuthA11yKeys,
  resolveAuthPathsFromEnv,
  waitForAuthPageReady,
  type AuthPageDef,
} from './auth-fixture';

/**
 * Authenticated a11y baselines (TASK-385) — ratcheted separately from public routes.
 */
test.describe('authenticated surfaces · accessibility', () => {
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

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const ruleIds = [...new Set(results.violations.map((v) => v.id))].sort();
        const keys = ruleIds.map((id) => authA11yKeyFor(pageDef.path, theme, id));

        if (isAuthA11yUpdateMode) {
          recordAuthA11yKeys(keys);
          test.info().annotations.push({
            type: 'auth-a11y-baseline',
            description: `Recorded ${keys.length} rule(s): ${ruleIds.join(', ') || 'none'}`,
          });
          return;
        }

        const baseline = loadAuthA11yBaseline();
        const newViolations = keys.filter((k) => !baseline.has(k));
        const details = results.violations
          .filter((v) => newViolations.includes(authA11yKeyFor(pageDef.path, theme, v.id)))
          .map((v) => `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
          .join('\n');

        expect(
          newViolations,
          `New auth accessibility violations on ${pageDef.path} [${theme}]:\n${details}\n` +
            `If intentional/unavoidable, run: npm run verify:auth-a11y:update`,
        ).toEqual([]);
      });
    }
  }
});
