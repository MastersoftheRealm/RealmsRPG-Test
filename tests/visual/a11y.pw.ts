import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { THEMES, A11Y_PAGES, themeInit } from './targets';
import { keyFor, loadBaseline, recordKeys, isUpdateMode } from './a11y-ratchet';

/**
 * Automated accessibility scan (axe-core) across themes. Catches ~30-40% of WCAG
 * issues (the rule-checkable ones) — notably color-contrast, names/labels, ARIA.
 * Ratcheted: fails only on NEW violations vs the committed baseline.
 */
test.describe('accessibility', () => {
  for (const theme of THEMES) {
    for (const path of A11Y_PAGES) {
      test(`${path} [${theme}]`, async ({ page, context }) => {
        await context.addInitScript(themeInit(theme), theme);
        await page.goto(path, { waitUntil: 'load' });
        await page.evaluate(() => (document as Document).fonts?.ready);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const ruleIds = [...new Set(results.violations.map((v) => v.id))].sort();
        const keys = ruleIds.map((id) => keyFor(path, theme, id));

        if (isUpdateMode) {
          recordKeys(keys);
          test.info().annotations.push({
            type: 'a11y-baseline',
            description: `Recorded ${keys.length} rule(s): ${ruleIds.join(', ') || 'none'}`,
          });
          return;
        }

        const baseline = loadBaseline();
        const newViolations = keys.filter((k) => !baseline.has(k));
        const details = results.violations
          .filter((v) => newViolations.includes(keyFor(path, theme, v.id)))
          .map((v) => `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
          .join('\n');

        expect(
          newViolations,
          `New accessibility violations on ${path} [${theme}]:\n${details}\n` +
            `If intentional/unavoidable, run: npm run verify:a11y:update`,
        ).toEqual([]);
      });
    }
  }
});
