import type { Locator, Page } from '@playwright/test';

/** next-themes has hydrated once the toggle shows the resolved theme name. */
export const STYLEGUIDE_THEME_TOGGLE = /^Toggle theme \((light|dark)\)$/;

/** CSS injected before mobile styleguide captures (empty toast portal safe-area flake). */
export const HIDE_SCREENSHOT_CHROME_CSS = `
  [aria-label="Notifications"] {
    display: none !important;
  }
  vercel-live-feedback,
  iframe[src*="vercel"] {
    display: none !important;
  }
`;

/** Mobile full-page styleguide height when the Category chip row matches the Linux baseline PNG. */
export const STYLEGUIDE_MOBILE_BASELINE_SCROLL_HEIGHT = 10_763;

/** Extra page height when Category loses Duration on the first line (one chip row + gap-3). */
export const STYLEGUIDE_CATEGORY_WRAP_EXTRA_HEIGHT_PX = 42;

/**
 * Returns true when Duration shares the first Category line with Action (committed baseline).
 */
export function isStyleguideCategoryRowBaselineLayout(
  durationTop: number,
  actionTop: number,
  sameLineEpsilonPx = 8,
): boolean {
  return Math.abs(durationTop - actionTop) <= sameLineEpsilonPx;
}

/**
 * Returns true when the Category row wrapped (Duration dropped to its own line).
 */
export function isStyleguideCategoryRowWrappedLayout(
  durationTop: number,
  actionTop: number,
  wrappedLineEpsilonPx = 20,
): boolean {
  return durationTop - actionTop >= wrappedLineEpsilonPx;
}

/**
 * Returns true when the last \`requiredStable\` height samples are identical.
 * Used to end polling before full-page screenshots (styleguide mobile flake).
 */
export function isDocumentHeightSettled(samples: number[], requiredStable = 3): boolean {
  if (samples.length < requiredStable) return false;
  const tail = samples.slice(-requiredStable);
  const height = tail[0];
  return tail.every((value) => value === height);
}

export async function readDocumentScrollHeight(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight);
}

export async function waitForStableDocumentHeight(
  page: Page,
  options?: { requiredStable?: number; intervalMs?: number; timeoutMs?: number },
): Promise<number> {
  const requiredStable = options?.requiredStable ?? 3;
  const intervalMs = options?.intervalMs ?? 100;
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const samples: number[] = [];
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    samples.push(await readDocumentScrollHeight(page));
    if (isDocumentHeightSettled(samples, requiredStable)) {
      const settled = samples[samples.length - 1];
      if (settled === undefined) {
        throw new Error('No height samples collected');
      }
      return settled;
    }
    await page.waitForTimeout(intervalMs);
  }

  throw new Error(
    `Document height did not settle within ${timeoutMs}ms (samples: ${samples.join(', ')})`,
  );
}

/** Masks fixed portals that can extend mobile full-page capture height. */
export function styleguideMobileScreenshotMasks(page: Page): Locator[] {
  return [page.locator('[aria-label="Notifications"]')];
}

/**
 * Chips › Category row must match the committed mobile baseline (Duration on line 1).
 */
export async function assertStyleguideCategoryRowBaseline(page: Page): Promise<void> {
  const chipsSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Chips', exact: true }),
  });
  const categoryRow = chipsSection
    .locator('.flex.flex-col.gap-2')
    .filter({ has: page.getByText('Category', { exact: true }) });
  const firstCategoryLine = categoryRow.locator(':scope > div > div').first();
  const action = firstCategoryLine.getByText('Action', { exact: true });
  const duration = firstCategoryLine.getByText('Duration', { exact: true });

  const [actionBox, durationBox] = await Promise.all([
    action.boundingBox(),
    duration.boundingBox(),
  ]);
  if (!actionBox || !durationBox) {
    throw new Error('Styleguide Category row chips missing bounding box');
  }
  if (!isStyleguideCategoryRowBaselineLayout(durationBox.y, actionBox.y)) {
    throw new Error(
      `Category row wrapped: Duration top ${durationBox.y} vs Action top ${actionBox.y} (expected same line)`,
    );
  }
}

/**
 * Settle layout after navigation: webfonts, styleguide theme hydration, and a stable
 * document height. Mobile styleguide skips the short fixed settle for other routes.
 */
export async function prepareDeterministicScreenshotPage(
  page: Page,
  pageDef: { name: string; path: string },
  viewportName: string,
): Promise<void> {
  await page.evaluate(() => (document as Document).fonts?.ready);

  if (pageDef.name === 'styleguide') {
    await page
      .getByRole('button', { name: STYLEGUIDE_THEME_TOGGLE })
      .waitFor({ state: 'visible', timeout: 15_000 });

    if (viewportName === 'mobile') {
      await page
        .locator('[aria-label="Notifications"]')
        .waitFor({ state: 'attached', timeout: 5_000 })
        .catch(() => {});
      await page.addStyleTag({ content: HIDE_SCREENSHOT_CHROME_CSS });
      await waitForStableDocumentHeight(page);
      await assertStyleguideCategoryRowBaseline(page);
      return;
    }

    await page.waitForTimeout(350);
    return;
  }

  await page.waitForTimeout(350);
}
