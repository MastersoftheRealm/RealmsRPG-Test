import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.site-copy-audit');

async function snap(page: import('@playwright/test').Page, name: string, fullPage = true) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage,
  });
}

test.describe('TASK-390 site copy audit', () => {
  test('about carousel + creator note', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/about', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'About Realms', level: 1 })).toBeVisible();
    await expect(page.getByText(/your ideas into reality/i)).toBeVisible();
    // Creator note uses period after emphasis, not comma before "I deeply"
    await expect(page.getByText(/reality,\s*I deeply/i)).toHaveCount(0);

    await snap(page, '01-about-desktop-full');

    // Advance carousel once if dice controls are present
    const nextDie = page.getByRole('button', { name: /next|d\d/i }).first();
    if (await nextDie.isVisible().catch(() => false)) {
      await nextDie.click().catch(() => undefined);
      await page.waitForTimeout(500);
    }
    await snap(page, '02-about-carousel-area', false);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload({ waitUntil: 'networkidle' });
    await snap(page, '03-about-mobile-full');
  });

  test('header nav labels', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const label of ['Characters', 'Library', 'Codex', 'About']) {
      await expect(page.getByRole('navigation').getByRole('link', { name: label }).first()).toBeVisible();
    }
    await snap(page, '04-header-nav', false);
  });

  test('rules + resources pages', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/rules', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Core Rulebook/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open in new tab' })).toBeVisible();
    await snap(page, '05-rules-desktop', false);

    await page.goto('/resources', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Resources', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Printable Character Sheet' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Click here to download/i })).toBeVisible();
    await snap(page, '06-resources-desktop-full');
  });

  test('privacy + terms from copy modules', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/privacy', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /RealmsRoleplayGame@gmail\.com/i })).toBeVisible();
    await snap(page, '07-privacy-full');

    await page.goto('/terms', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeVisible();
    await expect(page.getByText(/You retain ownership of the characters/i)).toBeVisible();
    await snap(page, '08-terms-full');
  });
});
