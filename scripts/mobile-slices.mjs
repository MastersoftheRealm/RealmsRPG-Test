/**
 * Capture a route as readable viewport-height slices, and outline any element
 * the audit flagged so the problem is visible in the image.
 *
 * Usage: node scripts/mobile-slices.mjs <route> [slices] [width]
 */
import { config as loadEnv } from 'dotenv';
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(repoRoot, '.env') });
loadEnv({ path: path.join(repoRoot, '.env.local'), override: true });

const route = process.argv[2] ?? '/';
const slices = Number(process.argv[3] ?? 6);
const width = Number(process.argv[4] ?? 390);
const BASE = 'http://localhost:3100';
const OUT = path.resolve(
  'C:/Users/kadin/OneDrive/Desktop/Code/RealmsRPG-Test/reports/mobile-audit-2026-08-18/slices',
);
const slug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

const browser = await chromium.launch();

// Optional session, for routes behind auth (same creds as mobile-audit-auth.mjs).
let storageState;
if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
  const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const lp = await authCtx.newPage();
  await lp.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await lp.locator('input[type="email"]').first().fill(process.env.E2E_TEST_EMAIL);
  await lp.locator('input[type="password"]').first().fill(process.env.E2E_TEST_PASSWORD);
  await lp.getByRole('button', { name: 'Sign in' }).first().click();
  await lp.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
  await lp.waitForTimeout(2000);
  storageState = await authCtx.storageState();
  await authCtx.close();
}

const context = await browser.newContext({
  ...devices['iPhone 13'],
  viewport: { width, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  ...(storageState ? { storageState } : {}),
});
await context.addInitScript(() => {
  const s = document.createElement('style');
  s.textContent = 'nextjs-portal{display:none !important}';
  document.documentElement.appendChild(s);
});
const page = await context.newPage();
await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Outline controls that break the mobile rules so they read in the screenshot.
await page.evaluate(() => {
  const sel =
    'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab]';
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 43.5 || r.width < 43.5) el.style.outline = '2px dashed #ff4d4d';
  }
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (/auto|scroll/.test(cs.overflowX)) continue;
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (own && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      el.style.outline = '2px solid #ffb020';
    }
  }
});

await mkdir(OUT, { recursive: true });
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
const n = Math.min(slices, Math.ceil(docH / 844));
for (let i = 0; i < n; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 800);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${slug}@${width}-s${i + 1}.png`) });
}
console.log(`${slug}: ${n} slices, docHeight ${docH}px`);
await browser.close();
