/**
 * Guided creator screenshots — tmp/guided-screenshots/
 * Run: node scripts/guided-creator-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'tmp', 'guided-screenshots');
const BASE = 'http://127.0.0.1:3000';

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

async function continueStep(page) {
  await page.getByRole('button', { name: /^(Continue|Next pick|Looks good)/ }).click();
  await page.waitForTimeout(500);
}

async function pickFirstCard(page) {
  await page.locator('[aria-label^="Choose"]').first().click();
  await page.waitForTimeout(250);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE}/characters/new/guided`, { waitUntil: 'networkidle' });
  await shot(page, '01-path');

  // Berserker
  await page.getByRole('heading', { name: 'Berserker' }).click();
  await page.waitForTimeout(250);
  await continueStep(page);
  await shot(page, '02-species');

  await pickFirstCard(page);
  await continueStep(page);
  await shot(page, '03-ancestry');

  // Ancestry: pick trait, skip flaw flow — advance through picks
  for (let i = 0; i < 4; i++) {
    const pick = page.locator('[aria-label^="Choose"]').first();
    if (await pick.isVisible().catch(() => false)) {
      await pick.click();
      await page.waitForTimeout(200);
    }
    const next = page.getByRole('button', { name: /^(Next pick|Continue)$/ });
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(400);
    }
  }

  await continueStep(page); // abilities
  await page.waitForTimeout(400);
  await shot(page, '04-skills');
  await continueStep(page); // archetype feats
  await page.waitForTimeout(600);
  await shot(page, '05-archetype-feats');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
