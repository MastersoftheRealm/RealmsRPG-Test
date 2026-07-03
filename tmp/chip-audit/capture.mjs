import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const OUT = 'tmp/chip-audit';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Styleguide chips section
await page.goto('http://localhost:3000/dev/styleguide', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/01-styleguide-chips.png`, fullPage: true });

// Codex feats - expand first row if possible
await page.goto('http://localhost:3000/codex?tab=feats', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const firstRow = page.locator('[data-testid="grid-list-row"], .grid-list-row, button:has-text("Expand")').first();
if (await firstRow.count()) {
  await firstRow.click({ timeout: 3000 }).catch(() => {});
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-codex-feats.png`, fullPage: false });

// Try expanding a feat row by clicking first list item
const rowButton = page.locator('div[role="button"]').filter({ hasText: /.+/ }).first();
await rowButton.click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/03-codex-feat-expanded.png`, fullPage: false });

await browser.close();
console.log('Screenshots saved to', OUT);
