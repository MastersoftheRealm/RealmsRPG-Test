import { test, expect, type Page } from '@playwright/test';
import {
  isUpdateMode,
  keyFor,
  loadBaseline,
  recordCounts,
  type ResponsiveCounts,
  type ResponsiveMetric,
} from './responsive-ratchet';

/**
 * Multi-width layout gate (ADR-0023).
 *
 * Guest / data-light routes only so CI never depends on a session. Auth-only
 * surfaces (character sheet) stay on `scripts/mobile-audit-auth.mjs` until
 * DEV-003 secrets are always present.
 *
 * Failures: a count going *up* vs `responsive-baseline.json`.
 * Update: `npm run verify:responsive:update`.
 */

export const RESPONSIVE_WIDTHS = [
  { width: 360, height: 800, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 1024, mobile: false },
  { width: 1024, height: 768, mobile: false },
  { width: 1280, height: 900, mobile: false },
  { width: 1440, height: 900, mobile: false },
] as const;

export const RESPONSIVE_PAGES = [
  '/',
  '/about',
  '/login',
  '/dev/styleguide',
  '/power-creator',
  '/item-creator',
  '/creature-creator',
  '/codex',
] as const;

const METRICS: ResponsiveMetric[] = [
  'horizontalPageScroll',
  'overflowRight',
  'textClippedNoEllipsis',
  'fixedOverlaps',
];

async function probe(page: Page): Promise<ResponsiveCounts> {
  return page.evaluate(() => {
    const SLACK = 1;
    const vis = (el: Element, r: DOMRect) =>
      r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    const vw = document.documentElement.clientWidth;
    const all = Array.from(document.querySelectorAll('body *')).filter(
      (e) => !e.closest('nextjs-portal'),
    );

    let overflowRight = 0;
    let textClippedNoEllipsis = 0;
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (!vis(el, r)) continue;
      if (r.right > vw + SLACK || r.left < -SLACK) {
        let n: HTMLElement | null = el.parentElement;
        let inScroller = false;
        while (n && n !== document.body) {
          if (/auto|scroll/.test(getComputedStyle(n).overflowX)) {
            inScroller = true;
            break;
          }
          n = n.parentElement;
        }
        const p = el.parentElement?.getBoundingClientRect();
        const parentAlsoOver = p && (p.right > vw + SLACK || p.left < -SLACK);
        if (!inScroller && !parentAlsoOver) overflowRight += 1;
      }
      const cs = getComputedStyle(el);
      if (/auto|scroll/.test(cs.overflowX)) continue;
      if (el.classList.contains('sr-only')) continue;
      const own = Array.from(el.childNodes).some(
        (n) => n.nodeType === 3 && (n.textContent || '').trim(),
      );
      if (own && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
        if (cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis') textClippedNoEllipsis += 1;
      }
    }

    const fixed = all.filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed') return false;
      const r = e.getBoundingClientRect();
      return vis(e, r);
    });
    let fixedOverlaps = 0;
    for (let i = 0; i < fixed.length; i++) {
      for (let j = i + 1; j < fixed.length; j++) {
        const a = fixed[i];
        const b = fixed[j];
        if (!a || !b || a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (ox > 2 && oy > 2) fixedOverlaps += 1;
      }
    }

    return {
      horizontalPageScroll: document.documentElement.scrollWidth > vw + SLACK ? 1 : 0,
      overflowRight,
      textClippedNoEllipsis,
      fixedOverlaps,
    };
  });
}

test.describe('responsive layout contracts', () => {
  for (const size of RESPONSIVE_WIDTHS) {
    for (const path of RESPONSIVE_PAGES) {
      test(`${path} @${size.width}`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.emulateMedia({
          reducedMotion: 'reduce',
          colorScheme: 'dark',
        });
        if (size.mobile) {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
          });
        }
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(1500);

        const counts = await probe(page);
        const recorded: Record<string, number> = {};
        for (const metric of METRICS) {
          recorded[keyFor(path, size.width, metric)] = counts[metric];
        }

        if (isUpdateMode) {
          recordCounts(recorded);
          test.info().annotations.push({
            type: 'responsive-baseline',
            description: Object.entries(counts)
              .map(([k, v]) => `${k}=${v}`)
              .join(' '),
          });
          return;
        }

        const baseline = loadBaseline();
        const regressions: string[] = [];
        for (const metric of METRICS) {
          const key = keyFor(path, size.width, metric);
          const actual = counts[metric];
          const allowed = baseline[key] ?? 0;
          if (actual > allowed) {
            regressions.push(`${metric}: ${actual} > allowed ${allowed}`);
          }
        }

        expect(
          regressions,
          `Layout regressions on ${path} @${size.width}px:\n  ${regressions.join('\n  ')}\n` +
            `If this is an intentional new exception, run: npm run verify:responsive:update`,
        ).toEqual([]);
      });
    }
  }
});
