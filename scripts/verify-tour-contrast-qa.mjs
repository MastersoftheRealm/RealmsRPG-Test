/**
 * QA measurements for sheet tour (320x568) and dark RollButton contrast.
 * Requires: `npm run build && npm run start` (or --base URL) and E2E creds for tour.
 *
 * Usage:
 *   node scripts/verify-tour-contrast-qa.mjs [--base http://localhost:3000]
 */
import { config as loadEnv } from 'dotenv';
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(repoRoot, '.env') });
loadEnv({ path: path.join(repoRoot, '.env.local'), override: true });

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const BASE = baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : 'http://localhost:3000';

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

function relativeLuminance([r, g, b]) {
  const lin = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fgRgb, bgRgb) {
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(cssColor) {
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

async function measureRollButtonsFromBuiltCss(page) {
  const cssDir = path.join(repoRoot, '.next', 'static', 'css');
  const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  if (cssFiles.length === 0) throw new Error('Run npm run build first');
  const links = cssFiles
    .map((f) => `<link rel="stylesheet" href="${BASE}/_next/static/css/${f}" />`)
    .join('\n');
  await page.setContent(
    `<!DOCTYPE html><html class="dark"><head>
      ${links}
    </head><body class="bg-background text-text-primary">
      <div data-character-sheet-page class="p-4">
        <button type="button" data-roll-trigger
          class="inline-flex items-center justify-center font-bold rounded-lg bg-success-600 hover:bg-success-700 text-text-on-dark px-3 py-1.5 text-sm min-w-[48px]">3</button>
        <button type="button" data-roll-trigger id="dmg"
          class="inline-flex items-center justify-center font-bold rounded-lg bg-danger-600 hover:bg-danger-700 text-text-on-dark px-3 py-1.5 text-sm min-w-[48px] ml-2">2d6</button>
      </div>
    </body></html>`,
    { waitUntil: 'networkidle' },
  );
  const success = page.locator('[data-roll-trigger].bg-success-600');
  const danger = page.locator('#dmg');
  await success.hover();
  const techniqueEnHover = await success.evaluate((el) => {
    const s = getComputedStyle(el);
    return { backgroundColor: s.backgroundColor, color: s.color };
  });
  await danger.hover();
  const damageHover = await danger.evaluate((el) => {
    const s = getComputedStyle(el);
    return { backgroundColor: s.backgroundColor, color: s.color };
  });
  await page.mouse.move(0, 0);
  return page.evaluate(
    ({ techniqueEnHover, damageHover }) => {
      const read = (el) => {
        const s = getComputedStyle(el);
        return { backgroundColor: s.backgroundColor, color: s.color };
      };
      const successEl = document.querySelector('[data-roll-trigger].bg-success-600');
      const dangerEl = document.getElementById('dmg');
      return {
        techniqueEn: read(successEl),
        techniqueEnHover,
        damage: read(dangerEl),
        damageHover,
      };
    },
    { techniqueEnHover, damageHover },
  );
}

async function measureTourFixture(page) {
  const cssDir = path.join(repoRoot, '.next', 'static', 'css');
  const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  const links = cssFiles
    .map((f) => `<link rel="stylesheet" href="${BASE}/_next/static/css/${f}" />`)
    .join('\n');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.setContent(
    `<!DOCTYPE html><html><head>${links}</head>
    <body class="bg-background">
      <div id="scroller" style="height:568px;overflow-y:auto;">
        <div style="height:120px"></div>
        <div id="target" data-tour-id="sheet-tour-abilities"
          style="height:1500px;border:2px solid transparent" class="ring-2 ring-primary-link-fg">Abilities</div>
      </div>
      <div id="card" role="dialog" aria-labelledby="sheet-tour-title"
        class="fixed z-tour left-4 right-4 max-w-[calc(100vw-2rem)] bottom-20 max-[480px]:bottom-20 max-[480px]:top-auto rounded-xl border bg-surface p-4 shadow-lg">
        <h2 id="sheet-tour-title">Abilities &amp; defenses</h2>
      </div>
    </body></html>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => {
    const target = document.getElementById('target');
    target?.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    const card = document.getElementById('card');
    const target = document.getElementById('target');
    const cardRect = card?.getBoundingClientRect();
    const targetRect = target?.getBoundingClientRect();
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      mode: 'fixture-tall-target',
      cardTop: cardRect ? Math.round(cardRect.top) : null,
      cardBottom: cardRect ? Math.round(cardRect.bottom) : null,
      positionedBottom: cardStyle?.bottom,
      positionedTop: cardStyle?.top,
      targetTop: targetRect ? Math.round(targetRect.top) : null,
      targetTopInView: targetRect
        ? targetRect.top >= 0 && targetRect.top < window.innerHeight
        : false,
      targetHeight: targetRect ? Math.round(targetRect.height) : null,
    };
  });
}

async function measureTour(page, characterId) {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${BASE}/characters/${characterId}`, { waitUntil: 'load' });
  await page.getByText('Loading character...').waitFor({ state: 'hidden', timeout: 60_000 });
  await page.getByRole('button', { name: /character settings/i }).click();
  await page.getByRole('button', { name: /take the tour again/i }).click({ timeout: 15_000 });

  const steps = ['Abilities', 'Skills', 'Library'];
  const out = [];

  for (const title of steps) {
    await page.getByRole('heading', { name: new RegExp(title, 'i') }).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(800);
    const snap = await page.evaluate(() => {
      const card = document.querySelector('[aria-labelledby="sheet-tour-title"]');
      const target =
        document.querySelector('[data-tour-id].ring-2') ?? document.querySelector('[data-tour-id]');
      const cardRect = card?.getBoundingClientRect();
      const targetRect = target?.getBoundingClientRect();
      const cardStyle = card ? getComputedStyle(card) : null;
      return {
        cardBottom: cardRect ? Math.round(cardRect.bottom) : null,
        cardTop: cardRect ? Math.round(cardRect.top) : null,
        positionedBottom: cardStyle?.bottom,
        positionedTop: cardStyle?.top,
        targetTop: targetRect ? Math.round(targetRect.top) : null,
        targetHeight: targetRect ? Math.round(targetRect.height) : null,
        targetTopInView: targetRect
          ? targetRect.top >= 0 && targetRect.top < window.innerHeight
          : false,
      };
    });
    out.push({ step: title, ...snap });
    await page.getByRole('button', { name: /^next$/i }).click();
  }
  return out;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const report = { base: BASE, contrast: null, tourFixture: null, tour: null };

  try {
    report.contrast = await measureRollButtonsFromBuiltCss(page);
    for (const key of ['techniqueEn', 'techniqueEnHover', 'damage', 'damageHover']) {
      const row = report.contrast[key];
      const fg = parseRgb(row.color);
      const bg = parseRgb(row.backgroundColor);
      row.contrastRatio = fg && bg ? Math.round(contrastRatio(fg, bg) * 100) / 100 : null;
    }
  } catch (err) {
    report.contrastError = String(err);
  }

  try {
    report.tourFixture = await measureTourFixture(page);
  } catch (err) {
    report.tourFixtureError = String(err);
  }

  if (EMAIL && PASSWORD) {
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await page.getByLabel('Email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45_000 });
    const manifest = JSON.parse(
      readFileSync(path.join(repoRoot, 'tests/visual/e2e-seed-manifest.json'), 'utf8'),
    );
    const characterId = process.env.E2E_TEST_CHARACTER_ID ?? manifest.characterId;
    try {
      report.tour = await measureTour(page, characterId);
    } catch (err) {
      report.tourError = String(err);
    }
  } else {
    report.tourSkipped = 'E2E_TEST_EMAIL/PASSWORD unset';
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
