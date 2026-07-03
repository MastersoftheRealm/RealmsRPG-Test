import { test, expect } from '@playwright/test';
import { THEMES, themeInit } from './targets';

/**
 * Element-level baselines for TASK-415 Phase E — expanded GridListRow chip patterns.
 * Feat row (descriptor metadata) + power library row (metadata + expandable parts).
 * Run `npm run verify:chip-unification:update` after intentional chip UI changes.
 */
for (const theme of THEMES) {
  test(`chip unification expanded rows · ${theme}`, async ({ page, context }) => {
    await context.addInitScript(themeInit(theme), theme);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dev/styleguide#chip-unification-rows', { waitUntil: 'load' });
    await page.evaluate(() => (document as Document).fonts?.ready);
    await page.waitForTimeout(350);

    const featRow = page.getByTestId('chip-unification-feat-row');
    await featRow.scrollIntoViewIfNeeded();
    await expect(featRow).toHaveScreenshot(`chip-unification-feat-row-${theme}.png`);

    const powerRow = page.getByTestId('chip-unification-power-row');
    await powerRow.scrollIntoViewIfNeeded();
    await expect(powerRow).toHaveScreenshot(`chip-unification-power-row-${theme}.png`);
  });
}
