/**
 * Authenticated half of the mobile UX audit.
 * =========================================
 * Logs in as the E2E baseline user, then runs the same probe as
 * `scripts/mobile-audit.mjs` over the surfaces that need a session — character
 * sheet (plus its modal states), campaign detail, My Library, crafting, account.
 *
 * Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD in .env.local
 * (see scripts/provision-e2e-baseline.js) and a running server.
 *
 * Usage: node scripts/mobile-audit-auth.mjs [--base http://localhost:3100] [--only <id>]
 * `--only sheet` also writes C1/C4/tour geometry to sheet-c1-c4.json (360/390 + desktop 1280).
 */
import { config as loadEnv } from 'dotenv';
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(repoRoot, '.env') });
loadEnv({ path: path.join(repoRoot, '.env.local'), override: true });

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const BASE = getArg('base', 'http://localhost:3100');
const ONLY = getArg('only', null);
const OUT = path.resolve(getArg('out', 'reports/mobile-audit-2026-08-18'));

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
  process.exit(1);
}

const manifest = JSON.parse(
  readFileSync(new URL('../tests/visual/e2e-seed-manifest.json', import.meta.url), 'utf8'),
);
const CHAR = process.env.E2E_TEST_CHARACTER_ID ?? manifest.characterId;
const CAMP = manifest.campaignId;

const WIDTHS = [
  { label: '390', width: 390, height: 844 },
  { label: '360', width: 360, height: 800 },
];

const ROUTES = [
  { id: 'auth-characters', url: '/characters' },
  { id: 'auth-sheet', url: `/characters/${CHAR}` },
  {
    id: 'auth-sheet-edit',
    url: `/characters/${CHAR}`,
    actions: [{ role: 'button', name: /edit/i }],
  },
  {
    id: 'auth-sheet-add-feat',
    url: `/characters/${CHAR}`,
    actions: [
      { role: 'button', name: /edit character/i },
      { text: /feats?/i },
      { role: 'button', name: /add (archetype |character |state )?feat/i },
    ],
  },
  {
    id: 'auth-sheet-add-library',
    url: `/characters/${CHAR}`,
    actions: [
      { role: 'button', name: /edit character/i },
      { role: 'button', name: /add (power|item|library)/i },
    ],
  },
  {
    id: 'auth-sheet-levelup',
    url: `/characters/${CHAR}`,
    actions: [{ role: 'button', name: /level up/i }],
  },
  {
    id: 'auth-sheet-recovery',
    url: `/characters/${CHAR}`,
    actions: [{ role: 'button', name: /recover|rest/i }],
  },
  { id: 'auth-campaigns', url: '/campaigns' },
  { id: 'auth-campaign-detail', url: `/campaigns/${CAMP}` },
  { id: 'auth-library-my', url: '/library' },
  { id: 'auth-codex-my', url: '/codex' },
  { id: 'auth-crafting', url: '/crafting' },
  { id: 'auth-my-account', url: '/my-account' },
  { id: 'auth-encounters', url: '/encounters' },
];

// Same probe as scripts/mobile-audit.mjs — keep the two in sync.
const PROBE = () => {
  const SLACK = 1;
  const MIN_TOUCH = 44;
  const vis = (el, r) =>
    r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  const desc = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .join('.');
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    const label = el.getAttribute('aria-label') || '';
    return (
      el.tagName.toLowerCase() +
      (el.id ? `#${el.id}` : '') +
      (cls ? `.${cls}` : '') +
      (label ? ` [aria-label="${label}"]` : '') +
      (text ? ` "${text}"` : '')
    );
  };
  const round = (r) => ({
    x: Math.round(r.x),
    y: Math.round(r.y),
    w: Math.round(r.width),
    h: Math.round(r.height),
  });
  const vw = document.documentElement.clientWidth;
  const all = Array.from(document.querySelectorAll('body *')).filter(
    (e) => !e.closest('nextjs-portal'),
  );
  const overflowRight = [];
  const textSpill = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (!vis(el, r)) continue;
    if (r.right > vw + SLACK || r.left < -SLACK) {
      const p = el.parentElement?.getBoundingClientRect();
      const pOver = p && (p.right > vw + SLACK || p.left < -SLACK);
      let n = el.parentElement;
      let inScroller = false;
      while (n && n !== document.body) {
        if (/auto|scroll/.test(getComputedStyle(n).overflowX)) {
          inScroller = true;
          break;
        }
        n = n.parentElement;
      }
      if (!pOver && !inScroller) {
        overflowRight.push({ el: desc(el), rect: round(r), overhang: Math.round(r.right - vw) });
      }
    }
    const cs = getComputedStyle(el);
    if (/auto|scroll/.test(cs.overflowX)) continue;
    if (el.classList.contains('sr-only')) continue;
    const own = Array.from(el.childNodes).some((n2) => n2.nodeType === 3 && n2.textContent.trim());
    if (own && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      textSpill.push({
        el: desc(el),
        clientW: el.clientWidth,
        scrollW: el.scrollWidth,
        clipped: cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis',
        rect: round(r),
      });
    }
  }
  const SEL =
    'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch]';
  const controls = Array.from(document.querySelectorAll(SEL))
    .filter((e) => !e.closest('nextjs-portal'))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => vis(el, r));
  const tooSmall = [];
  const oversized = [];
  const heights = [];
  for (const { el, r } of controls) {
    heights.push(Math.round(r.height));
    if (r.width < MIN_TOUCH - 0.5 || r.height < MIN_TOUCH - 0.5)
      tooSmall.push({ el: desc(el), rect: round(r) });
    const range = document.createRange();
    range.selectNodeContents(el);
    const ink = range.getBoundingClientRect();
    if (ink.width > 0 && r.width - ink.width > 40 && r.width > 88) {
      oversized.push({
        el: desc(el),
        rect: round(r),
        inkW: Math.round(ink.width),
        slackW: Math.round(r.width - ink.width),
      });
    }
  }
  const overlaps = [];
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const a = controls[i];
      const b = controls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > 2 && oy > 2) {
        overlaps.push({
          a: desc(a.el),
          b: desc(b.el),
          overlap: { w: Math.round(ox), h: Math.round(oy) },
        });
      }
    }
  }
  heights.sort((x, y) => x - y);
  return {
    viewport: { w: vw, h: window.innerHeight },
    horizontalPageScroll: document.documentElement.scrollWidth > vw + SLACK,
    medianControlHeight: heights.length ? heights[Math.floor(heights.length / 2)] : 0,
    counts: {
      overflowRight: overflowRight.length,
      textSpill: textSpill.length,
      tooSmall: tooSmall.length,
      oversized: oversized.length,
      overlaps: overlaps.length,
      controls: controls.length,
    },
    overflowRight: overflowRight.slice(0, 15),
    textSpill: textSpill.slice(0, 25),
    tooSmall: tooSmall.slice(0, 30),
    oversized: oversized.slice(0, 25),
    overlaps: overlaps.slice(0, 25),
  };
};

/** C1 panel heights, C4 dock/FAB/modal-footer overlaps, tour Next vs dock/FAB. */
const MEASURE_SHEET = () => {
  const overlapOf = (a, b) => {
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return ox > 2 && oy > 2 ? { w: Math.round(ox), h: Math.round(oy) } : null;
  };
  const findSheetColumn = () => {
    const carousel = document.querySelector('.character-sheet-mobile-frame .snap-x');
    if (!(carousel instanceof HTMLElement)) return null;
    let n = carousel.parentElement;
    while (n && n !== document.body) {
      const oy = getComputedStyle(n).overflowY;
      if (oy === 'auto' || oy === 'scroll') return n;
      n = n.parentElement;
    }
    return null;
  };
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const bodyH = document.body.scrollHeight;
  const frame = document.querySelector('.character-sheet-mobile-frame');
  const carousel = document.querySelector('.character-sheet-mobile-frame .snap-x');
  const column = findSheetColumn();
  const panels = Array.from(
    document.querySelectorAll('.character-sheet-mobile-frame section[aria-label]'),
  ).map((el) => {
    const r = el.getBoundingClientRect();
    const last = el.lastElementChild?.getBoundingClientRect();
    return {
      label: el.getAttribute('aria-label'),
      clientH: Math.round(el.clientHeight),
      scrollH: Math.round(el.scrollHeight),
      rect: { y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) },
      overflowY: getComputedStyle(el).overflowY,
      trailingBlank: last ? Math.max(0, Math.round(r.bottom - last.bottom)) : null,
    };
  });
  const dock = document.querySelector('.sheet-mobile-action-dock');
  const fabWrap = document.querySelector('.floating-dock-bottom-right');
  const dockButtons = dock
    ? Array.from(dock.querySelectorAll('button')).map((el) => ({
        label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40),
        rect: el.getBoundingClientRect().toJSON(),
      }))
    : [];
  const fabBtn = document.querySelector('.floating-dock-bottom-right button[aria-label]');
  const dockRect = dock?.getBoundingClientRect()?.toJSON() ?? null;
  const fabRect = fabBtn?.getBoundingClientRect()?.toJSON() ?? null;
  const dockVis = dock ? getComputedStyle(dock).visibility : 'missing';
  const fabVis = fabWrap ? getComputedStyle(fabWrap).visibility : 'missing';

  const toolbarFabOverlaps = [];
  if (fabRect && dockVis !== 'hidden' && fabVis !== 'hidden') {
    for (const b of dockButtons) {
      const hit = overlapOf(b.rect, fabRect);
      if (hit)
        toolbarFabOverlaps.push({
          a: b.label,
          b: fabBtn?.getAttribute('aria-label'),
          overlap: hit,
        });
    }
  }
  const toolbarPairOverlaps = [];
  for (let i = 0; i < dockButtons.length; i++) {
    for (let j = i + 1; j < dockButtons.length; j++) {
      const hit = overlapOf(dockButtons[i].rect, dockButtons[j].rect);
      if (hit) {
        toolbarPairOverlaps.push({
          a: dockButtons[i].label,
          b: dockButtons[j].label,
          overlap: hit,
        });
      }
    }
  }

  const modal = document.querySelector('[aria-modal="true"]');
  const footerBtn = modal
    ? Array.from(modal.querySelectorAll('button')).find((el) => {
        const t = (el.textContent || '').trim();
        return /full recovery|set level|add feat|add selected|confirm/i.test(t);
      })
    : null;
  const footerRect = footerBtn?.getBoundingClientRect()?.toJSON() ?? null;
  const footerVsFab =
    footerRect && fabRect && fabVis !== 'hidden' ? overlapOf(footerRect, fabRect) : null;
  const footerVsDock =
    footerRect && dockRect && dockVis !== 'hidden' ? overlapOf(footerRect, dockRect) : null;

  const tour = document.querySelector('[role="dialog"][aria-labelledby="sheet-tour-title"]');
  const nextBtn = tour
    ? Array.from(tour.querySelectorAll('button')).find((el) =>
        /next|you.re ready/i.test((el.textContent || '').trim()),
      )
    : null;
  const nextRect = nextBtn?.getBoundingClientRect()?.toJSON() ?? null;
  const nextVsDock =
    nextRect && dockRect && dockVis !== 'hidden' ? overlapOf(nextRect, dockRect) : null;
  const nextVsFab =
    nextRect && fabRect && fabVis !== 'hidden' ? overlapOf(nextRect, fabRect) : null;
  const nextFullyInView = nextRect
    ? nextRect.top >= 0 &&
      nextRect.left >= 0 &&
      nextRect.bottom <= vh + 1 &&
      nextRect.right <= vw + 1
    : null;

  return {
    viewport: { w: vw, h: vh },
    docScrollH: docH,
    bodyScrollH: bodyH,
    docVsViewport: docH - vh,
    frameH: frame ? Math.round(frame.getBoundingClientRect().height) : null,
    columnH: column ? Math.round(column.clientHeight) : null,
    columnScrollH: column ? Math.round(column.scrollHeight) : null,
    carouselH: carousel ? Math.round(carousel.getBoundingClientRect().height) : null,
    panels,
    maxPanelScrollH: panels.reduce((m, p) => Math.max(m, p.scrollH), 0),
    maxPanelClientH: panels.reduce((m, p) => Math.max(m, p.clientH), 0),
    dock: {
      visibility: dockVis,
      rect: dockRect,
      buttons: dockButtons.map((b) => ({
        label: b.label,
        x: Math.round(b.rect.x),
        y: Math.round(b.rect.y),
        w: Math.round(b.rect.width),
        h: Math.round(b.rect.height),
      })),
    },
    fab: {
      visibility: fabVis,
      label: fabBtn?.getAttribute('aria-label') ?? null,
      rect: fabRect
        ? {
            x: Math.round(fabRect.x),
            y: Math.round(fabRect.y),
            w: Math.round(fabRect.width),
            h: Math.round(fabRect.height),
          }
        : null,
    },
    toolbarFabOverlaps,
    toolbarPairOverlaps,
    modal: modal
      ? {
          title: modal.getAttribute('aria-labelledby') || modal.getAttribute('aria-label'),
          footerLabel: footerBtn ? (footerBtn.textContent || '').trim().slice(0, 40) : null,
          footerRect: footerRect
            ? {
                x: Math.round(footerRect.x),
                y: Math.round(footerRect.y),
                w: Math.round(footerRect.width),
                h: Math.round(footerRect.height),
              }
            : null,
          footerVsFab,
          footerVsDock,
          docksHidden: dockVis === 'hidden' && fabVis === 'hidden',
        }
      : null,
    tour: tour
      ? {
          title: tour.querySelector('#sheet-tour-title')?.textContent?.trim() ?? null,
          nextLabel: nextBtn ? (nextBtn.textContent || '').trim() : null,
          nextRect: nextRect
            ? {
                x: Math.round(nextRect.x),
                y: Math.round(nextRect.y),
                w: Math.round(nextRect.width),
                h: Math.round(nextRect.height),
              }
            : null,
          nextFullyInView,
          nextVsDock,
          nextVsFab,
        }
      : null,
  };
};

const hideNextjsPortal = () => {
  const s = document.createElement('style');
  s.textContent = 'nextjs-portal{display:none !important}';
  document.documentElement.appendChild(s);
};

const browser = await chromium.launch();

// --- sign in once, reuse the session for every width/route ---
const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const login = await authCtx.newPage();
async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.getByLabel('Email').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    if (!form) return false;
    return Object.keys(form).some((k) => k.startsWith('__react'));
  });
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
}
try {
  await signIn(login);
  await login.waitForTimeout(800);
} catch (err) {
  console.error(`login: FAILED → ${new URL(login.url()).pathname}`);
  const alertText = await login
    .locator('[role="alert"]')
    .innerText()
    .catch(() => '');
  if (alertText) console.error(alertText);
  console.error(err.message.split('\n')[0]);
  await browser.close();
  process.exit(1);
}
console.log(`login: OK → ${new URL(login.url()).pathname}`);
const storageState = await authCtx.storageState();
await authCtx.close();

await mkdir(path.join(OUT, 'shots'), { recursive: true });
const results = [];

for (const size of WIDTHS) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    storageState,
  });
  await context.addInitScript(hideNextjsPortal);

  for (const route of ROUTES) {
    if (ONLY && !route.id.includes(ONLY)) continue;
    const page = await context.newPage();
    const notes = [];
    try {
      await page.goto(BASE + route.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);
      for (const a of route.actions ?? []) {
        try {
          const loc = a.role ? page.getByRole(a.role, { name: a.name }) : page.getByText(a.text);
          await loc.first().click({ timeout: 5000 });
          await page.waitForTimeout(1200);
        } catch (e) {
          notes.push(`action miss: ${a.name ?? a.text} — ${e.message.split('\n')[0].slice(0, 80)}`);
        }
      }
      const probe = await page.evaluate(PROBE);
      const shot = `${route.id}@${size.label}`;
      await page.screenshot({ path: path.join(OUT, 'shots', `${shot}.png`) });
      results.push({
        route: route.id,
        url: route.url,
        width: size.label,
        finalUrl: new URL(page.url()).pathname,
        notes,
        ...probe,
      });
      console.log(
        `${route.id}@${size.label}  medianH:${probe.medianControlHeight} overflow:${probe.counts.overflowRight} spill:${probe.counts.textSpill} small:${probe.counts.tooSmall} big:${probe.counts.oversized} overlap:${probe.counts.overlaps} hScroll:${probe.horizontalPageScroll}${notes.length ? '  [' + notes.length + ' action misses]' : ''}`,
      );
    } catch (err) {
      results.push({ route: route.id, width: size.label, error: err.message.split('\n')[0] });
      console.log(`${route.id}@${size.label}  ERROR ${err.message.split('\n')[0]}`);
    } finally {
      await page.close();
    }
  }
  await context.close();
}

const SHEET = `/characters/${CHAR}`;
const RUN_SHEET_GEOMETRY = !ONLY || ONLY === 'sheet';

if (RUN_SHEET_GEOMETRY) {
  await mkdir(path.join(OUT, 'probes'), { recursive: true });
  const geometry = [];

  const revealCarousel = async (page) => {
    await page.evaluate(() => {
      const carousel = document.querySelector('.character-sheet-mobile-frame .snap-x');
      if (!(carousel instanceof HTMLElement)) return;
      let n = carousel.parentElement;
      while (n && n !== document.body) {
        const oy = getComputedStyle(n).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          n.scrollTop = carousel.offsetTop;
          return;
        }
        n = n.parentElement;
      }
    });
    await page.waitForTimeout(400);
  };

  const gotoSheet = async (page) => {
    await page.goto(BASE + SHEET, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page
      .getByText('Loading character...')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
    const skip = page.getByRole('button', { name: /^skip$/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(400);
    }
  };

  const openTour = async (page) => {
    await page.getByRole('button', { name: 'Character settings' }).click({ timeout: 8000 });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /take the tour again/i }).click({ timeout: 8000 });
    await page.waitForTimeout(800);
  };

  for (const size of WIDTHS) {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      storageState,
    });
    await context.addInitScript(hideNextjsPortal);
    const page = await context.newPage();

    await gotoSheet(page);
    const idle = await page.evaluate(MEASURE_SHEET);
    await page.screenshot({ path: path.join(OUT, 'probes', `sheet-idle@${size.label}.png`) });
    console.log(
      `idle@${size.label}  docExtra:${idle.docVsViewport} frameH:${idle.frameH} col:${idle.columnH}/${idle.columnScrollH} carouselH:${idle.carouselH} maxClientH:${idle.maxPanelClientH} fabOverlaps:${idle.toolbarFabOverlaps.length}`,
    );
    geometry.push({ width: size.label, state: 'idle', ...idle });

    await revealCarousel(page);
    const scrolled = await page.evaluate(MEASURE_SHEET);
    await page.screenshot({ path: path.join(OUT, 'probes', `sheet-scrolled@${size.label}.png`) });
    console.log(
      `scrolled@${size.label}  docExtra:${scrolled.docVsViewport} carouselH:${scrolled.carouselH} maxClientH:${scrolled.maxPanelClientH} abilities:${JSON.stringify(scrolled.panels?.[0])} fabOverlaps:${scrolled.toolbarFabOverlaps.length}`,
    );
    geometry.push({ width: size.label, state: 'idle-scrolled', ...scrolled });

    const openModal = async (triggerName, shot) => {
      await gotoSheet(page);
      await page.getByRole('button', { name: triggerName }).first().click({ timeout: 8000 });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(MEASURE_SHEET);
      await page.screenshot({ path: path.join(OUT, 'probes', `${shot}@${size.label}.png`) });
      console.log(
        `${shot}@${size.label}  docksHidden:${m.modal?.docksHidden} footerVsFab:${JSON.stringify(m.modal?.footerVsFab)} footerVsDock:${JSON.stringify(m.modal?.footerVsDock)} footer:${m.modal?.footerLabel}`,
      );
      geometry.push({ width: size.label, state: shot, ...m });
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    };

    await openModal('Recovery', 'recovery');
    await openModal('Level Up', 'levelup');

    await gotoSheet(page);
    try {
      await page.getByRole('button', { name: 'Edit character' }).click({ timeout: 8000 });
      await page.waitForTimeout(600);
      await revealCarousel(page);
      await page.evaluate(() => {
        const carousel = document.querySelector('.character-sheet-mobile-frame .snap-x');
        const library = document.querySelector(
          '.character-sheet-mobile-frame [aria-label="Library"]',
        );
        if (carousel instanceof HTMLElement && library instanceof HTMLElement) {
          carousel.scrollLeft = library.offsetLeft;
          const column = library.closest('[data-sheet-mobile-column]');
          if (column instanceof HTMLElement) column.scrollTop = library.offsetTop;
        }
      });
      await page.waitForTimeout(800);
      await page
        .getByRole('tab', { name: /feats/i })
        .first()
        .click({ timeout: 4000 })
        .catch(() => {});
      await page.waitForTimeout(400);
      const addFeat = page
        .getByRole('button', { name: /add (archetype |character |state )?feat/i })
        .first();
      await addFeat.waitFor({ state: 'attached', timeout: 8000 });
      await addFeat.scrollIntoViewIfNeeded();
      await addFeat.click({ timeout: 8000 });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(MEASURE_SHEET);
      await page.screenshot({ path: path.join(OUT, 'probes', `add-feat@${size.label}.png`) });
      console.log(
        `add-feat@${size.label}  docksHidden:${m.modal?.docksHidden} footerVsFab:${JSON.stringify(m.modal?.footerVsFab)} footer:${m.modal?.footerLabel}`,
      );
      geometry.push({ width: size.label, state: 'add-feat', ...m });
      await page.keyboard.press('Escape').catch(() => {});
    } catch (err) {
      console.log(`add-feat@${size.label}  miss: ${err.message.split('\n')[0].slice(0, 120)}`);
      geometry.push({ width: size.label, state: 'add-feat', error: err.message.split('\n')[0] });
      await page
        .screenshot({ path: path.join(OUT, 'probes', `add-feat-miss@${size.label}.png`) })
        .catch(() => {});
    }

    await gotoSheet(page);
    try {
      await openTour(page);
      const tour = await page.evaluate(MEASURE_SHEET);
      await page.screenshot({ path: path.join(OUT, 'probes', `tour-next@${size.label}.png`) });
      console.log(
        `tour@${size.label}  nextInView:${tour.tour?.nextFullyInView} nextVsDock:${JSON.stringify(tour.tour?.nextVsDock)} nextVsFab:${JSON.stringify(tour.tour?.nextVsFab)} next:${JSON.stringify(tour.tour?.nextRect)}`,
      );
      geometry.push({ width: size.label, state: 'tour', ...tour });
    } catch (err) {
      console.log(`tour@${size.label}  miss: ${err.message.split('\n')[0].slice(0, 120)}`);
      geometry.push({ width: size.label, state: 'tour', error: err.message.split('\n')[0] });
    }

    await page.close();
    await context.close();
  }

  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
    storageState,
  });
  await desktopCtx.addInitScript(hideNextjsPortal);
  const desktop = await desktopCtx.newPage();
  try {
    await gotoSheet(desktop);
    const idleDesktop = await desktop.evaluate(MEASURE_SHEET);
    await desktop.screenshot({ path: path.join(OUT, 'probes', 'sheet-idle@1280.png') });
    console.log(
      `idle@1280  fab:${JSON.stringify(idleDesktop.fab?.rect)} vis:${idleDesktop.fab?.visibility}`,
    );
    geometry.push({ width: '1280', state: 'idle', ...idleDesktop });

    await openTour(desktop);
    const tourDesktop = await desktop.evaluate(MEASURE_SHEET);
    await desktop.screenshot({ path: path.join(OUT, 'probes', 'tour-next@1280.png') });
    console.log(
      `tour@1280  nextInView:${tourDesktop.tour?.nextFullyInView} nextVsDock:${JSON.stringify(tourDesktop.tour?.nextVsDock)} nextVsFab:${JSON.stringify(tourDesktop.tour?.nextVsFab)} next:${JSON.stringify(tourDesktop.tour?.nextRect)} fab:${JSON.stringify(tourDesktop.fab?.rect)}`,
    );
    geometry.push({ width: '1280', state: 'tour', ...tourDesktop });
  } catch (err) {
    console.log(`tour@1280  miss: ${err.message.split('\n')[0].slice(0, 120)}`);
    geometry.push({ width: '1280', state: 'tour', error: err.message.split('\n')[0] });
    await desktop
      .screenshot({ path: path.join(OUT, 'probes', 'tour-next-miss@1280.png') })
      .catch(() => {});
  }
  await desktop.close();
  await desktopCtx.close();

  await writeFile(path.join(OUT, 'sheet-c1-c4.json'), JSON.stringify(geometry, null, 2));
  console.log(
    `\nWrote ${geometry.length} sheet geometry results to ${path.join(OUT, 'sheet-c1-c4.json')}`,
  );
}

await browser.close();
await writeFile(path.join(OUT, 'findings-auth.json'), JSON.stringify(results, null, 2));
console.log(`\nWrote ${results.length} results to ${path.join(OUT, 'findings-auth.json')}`);
