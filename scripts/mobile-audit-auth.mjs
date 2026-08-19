/**
 * Authenticated half of the mobile UX audit.
 * =========================================
 * Logs in as the E2E baseline user, then runs the same probe as
 * `scripts/mobile-audit.mjs` over the surfaces that need a session — character
 * sheet (plus its modal states), campaign detail, My Library, crafting, account.
 *
 * Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD (see scripts/provision-e2e-baseline.js)
 * and a running server.
 *
 * Usage: node scripts/mobile-audit-auth.mjs [--base http://localhost:3100] [--only <id>]
 */
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readFileSync } from 'node:fs';

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
const CHAR = manifest.characterId;
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
    actions: [{ text: /feats?/i }, { role: 'button', name: /add feat/i }],
  },
  {
    id: 'auth-sheet-add-library',
    url: `/characters/${CHAR}`,
    actions: [{ role: 'button', name: /add (power|item|library)/i }],
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

const browser = await chromium.launch();

// --- sign in once, reuse the session for every width/route ---
const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const login = await authCtx.newPage();
await login.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await login.locator('input[type="email"]').first().fill(EMAIL);
await login.locator('input[type="password"]').first().fill(PASSWORD);
await login.getByRole('button', { name: 'Sign in' }).first().click();
await login.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {});
await login.waitForTimeout(2500);
const signedIn = !new URL(login.url()).pathname.startsWith('/login');
console.log(`login: ${signedIn ? 'OK' : 'FAILED'} → ${login.url()}`);
if (!signedIn) {
  console.error(
    await login
      .locator('body')
      .innerText()
      .catch(() => ''),
  );
  await browser.close();
  process.exit(1);
}
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
  await context.addInitScript(() => {
    const s = document.createElement('style');
    s.textContent = 'nextjs-portal{display:none !important}';
    document.documentElement.appendChild(s);
  });

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

await browser.close();
await writeFile(path.join(OUT, 'findings-auth.json'), JSON.stringify(results, null, 2));
console.log(`\nWrote ${results.length} results to ${path.join(OUT, 'findings-auth.json')}`);
