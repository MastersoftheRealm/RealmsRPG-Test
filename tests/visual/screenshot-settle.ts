import type { Locator, Page } from '@playwright/test';

/** next-themes has hydrated once the toggle shows the resolved theme name. */
export const STYLEGUIDE_THEME_TOGGLE = /^Toggle theme \((light|dark)\)$/;

/** CSS injected before mobile styleguide captures (empty toast portal safe-area flake). */
export const HIDE_SCREENSHOT_CHROME_CSS = `
  [aria-label="Notifications"] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }
  vercel-live-feedback,
  iframe[src*="vercel"] {
    display: none !important;
  }
`;

const SCREENSHOT_CHROME_HIDE_STYLE_ID = 'playwright-screenshot-chrome-hide';

/**
 * Init script: hide fixed portals before React mounts so they never extend
 * mobile full-page scrollHeight (intermittent +42px; see PR #543).
 */
export function screenshotChromeHideInitScript(): void {
  const install = () => {
    if (document.getElementById(SCREENSHOT_CHROME_HIDE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SCREENSHOT_CHROME_HIDE_STYLE_ID;
    style.textContent = HIDE_SCREENSHOT_CHROME_CSS;
    document.documentElement.appendChild(style);
  };

  install();
  document.addEventListener('DOMContentLoaded', install);
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
  options?: {
    requiredStable?: number;
    intervalMs?: number;
    timeoutMs?: number;
    /** Extra time with no height change after the last identical samples. */
    quietMs?: number;
  },
): Promise<number> {
  const requiredStable = options?.requiredStable ?? 3;
  const intervalMs = options?.intervalMs ?? 100;
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const quietMs = options?.quietMs ?? 400;
  const samples: number[] = [];
  const deadline = Date.now() + timeoutMs;
  let stableSince: number | null = null;
  let previousHeight: number | undefined;

  while (Date.now() < deadline) {
    const height = await readDocumentScrollHeight(page);
    samples.push(height);

    if (previousHeight !== undefined && height !== previousHeight) {
      stableSince = null;
    }
    previousHeight = height;

    if (isDocumentHeightSettled(samples, requiredStable)) {
      stableSince ??= Date.now();
      if (Date.now() - stableSince >= quietMs) {
        return height;
      }
    } else {
      stableSince = null;
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
      await page.addStyleTag({ content: HIDE_SCREENSHOT_CHROME_CSS });
      await waitForStableDocumentHeight(page, { quietMs: 500 });
      return;
    }

    await page.waitForTimeout(350);
    return;
  }

  await page.waitForTimeout(350);
}
