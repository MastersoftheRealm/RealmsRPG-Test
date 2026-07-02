import { test, expect } from '@playwright/test';
import { VIEWPORTS, THEMES, SCREENSHOT_PAGES, themeInit } from './targets';

/**
 * Full-page visual baselines across breakpoints x themes for deterministic routes.
 * Run `npm run verify:visual:update` to (re)generate baselines after an intended change.
 */
for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    test.describe(`${vp.name} · ${theme}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const pageDef of SCREENSHOT_PAGES) {
        test(pageDef.name, async ({ page, context }) => {
          await context.addInitScript(themeInit(theme), theme);
          await page.goto(pageDef.path, { waitUntil: 'load' });
          // Settle webfonts + any first-paint layout before snapping.
          await page.evaluate(() => (document as Document).fonts?.ready);
          await page.waitForTimeout(350);
          await expect(page).toHaveScreenshot(`${pageDef.name}-${vp.name}-${theme}.png`, {
            fullPage: true,
          });
        });
      }
    });
  }
}
