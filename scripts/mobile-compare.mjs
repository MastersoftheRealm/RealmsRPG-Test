/**
 * Measure comparable mobile density metrics on an external reference site and
 * on our own pages, so "ours feels bulkier" becomes a number instead of a vibe.
 *
 * Metrics per page:
 *   - chromeBeforeContent: y of the first list/content row (how far you scroll
 *     past headers/search/tabs before you see actual data)
 *   - control height histogram (interactive elements)
 *   - median row height of the primary list
 */
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const targets = [
  {
    id: 'ddb-spells',
    url: 'https://www.dndbeyond.com/spells',
    rowSel: '.listing-body .info, .list-row, .row',
  },
  {
    id: 'ddb-monsters',
    url: 'https://www.dndbeyond.com/monsters',
    rowSel: '.listing-body .info, .list-row, .row',
  },
  { id: 'realms-codex', url: 'http://localhost:3100/codex', rowSel: '[data-glr-row]' },
  { id: 'realms-library', url: 'http://localhost:3100/library', rowSel: '[data-glr-row]' },
];

const OUT = path.resolve(
  'C:/Users/kadin/OneDrive/Desktop/Code/RealmsRPG-Test/reports/mobile-audit-2026-08-18',
);

const METRICS = (rowSel) => {
  const vw = document.documentElement.clientWidth;
  const controls = Array.from(
    document.querySelectorAll(
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab]',
    ),
  )
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);

  const heights = controls.map((r) => Math.round(r.height)).sort((a, b) => a - b);
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 0;
  const buckets = { under32: 0, '32to43': 0, '44to52': 0, over52: 0 };
  for (const h of heights) {
    if (h < 32) buckets.under32++;
    else if (h < 44) buckets['32to43']++;
    else if (h <= 52) buckets['44to52']++;
    else buckets.over52++;
  }

  const rows = Array.from(document.querySelectorAll(rowSel))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > vw * 0.6 && r.height > 24 && r.height < 400);
  const rowHeights = rows.map((r) => Math.round(r.height)).sort((a, b) => a - b);
  const firstRowY = rows.length
    ? Math.round(Math.min(...rows.map((r) => r.top + window.scrollY)))
    : null;

  return {
    viewportW: vw,
    controlCount: controls.length,
    medianControlHeight: median,
    controlHeightBuckets: buckets,
    rowCount: rows.length,
    medianRowHeight: rowHeights.length ? rowHeights[Math.floor(rowHeights.length / 2)] : null,
    chromeBeforeContent: firstRowY,
    docHeight: document.documentElement.scrollHeight,
  };
};

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices['iPhone 13'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mkdir(path.join(OUT, 'compare'), { recursive: true });

const results = [];
for (const t of targets) {
  const page = await context.newPage();
  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    // Consent/ad chrome would otherwise dominate the reference measurements.
    for (const name of [/reject non-essential/i, /accept all/i, /dismiss/i]) {
      await page
        .getByRole('button', { name })
        .first()
        .click({ timeout: 2500 })
        .catch(() => {});
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      for (const el of document.querySelectorAll(
        '[id*="ad-"],[class*="advert"],[class*="cookie"],[id*="onetrust"]',
      )) {
        el.remove();
      }
    });
    await page.waitForTimeout(500);
    const m = await page.evaluate(METRICS, t.rowSel);
    await page.screenshot({ path: path.join(OUT, 'compare', `${t.id}.png`) });
    results.push({ id: t.id, url: t.url, ...m });
    console.log(
      `${t.id}  medianControlH=${m.medianControlHeight}  chromeBeforeContent=${m.chromeBeforeContent}  medianRowH=${m.medianRowHeight}  buckets=${JSON.stringify(m.controlHeightBuckets)}`,
    );
  } catch (err) {
    results.push({ id: t.id, url: t.url, error: err.message.split('\n')[0] });
    console.log(`${t.id}  ERROR ${err.message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
}
await writeFile(path.join(OUT, 'compare', 'metrics.json'), JSON.stringify(results, null, 2));
await browser.close();
