/**
 * Mobile UX audit capture
 * =======================
 * Drives a real mobile-emulated Chromium (touch, coarse pointer, no hover) over
 * the app's routes and records, per route and per width:
 *
 *   - a viewport + full-page screenshot
 *   - horizontal page overflow and which element causes it
 *   - text that overflows its own box ("words spill")
 *   - interactive controls below the 44px touch minimum
 *   - interactive controls whose hit box is far wider than their content
 *   - overlapping interactive controls
 *
 * Coarse pointer matters: Button/IconButton apply their 44px minimum behind
 * `@media(pointer:coarse)`, so a desktop browser narrowed to 390px does NOT
 * reproduce what the owner sees on a phone.
 *
 * Usage: node scripts/mobile-audit.mjs [--base http://localhost:3000] [--out reports/mobile-audit-<date>]
 */
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = getArg('base', 'http://localhost:3000');
const OUT = path.resolve(getArg('out', 'reports/mobile-audit-2026-08-18'));
const ONLY = getArg('only', null);

/** Widths to audit. 390 = iPhone 13/14/15. 360 = the common small Android floor. */
const WIDTHS = [
  { label: '390', width: 390, height: 844 },
  { label: '360', width: 360, height: 800 },
];

/**
 * Routes. `actions` run after load to reach a state worth auditing (menu open,
 * modal open, row expanded). Each action is best-effort; a miss is recorded but
 * never fails the run.
 */
const ROUTES = [
  { id: 'home', url: '/' },
  { id: 'home-nav-open', url: '/', actions: [{ role: 'button', name: 'Toggle navigation menu' }] },
  { id: 'about', url: '/about' },
  { id: 'rules', url: '/rules' },
  { id: 'resources', url: '/resources' },
  { id: 'login', url: '/login' },
  { id: 'codex', url: '/codex' },
  { id: 'codex-row-expanded', url: '/codex', actions: [{ firstListRow: true }] },
  { id: 'codex-feats', url: '/codex?tab=feats' },
  { id: 'library', url: '/library' },
  { id: 'characters', url: '/characters' },
  { id: 'characters-new', url: '/characters/new' },
  { id: 'creator-guided', url: '/characters/new/guided' },
  { id: 'power-creator', url: '/power-creator' },
  { id: 'item-creator', url: '/item-creator' },
  { id: 'technique-creator', url: '/technique-creator' },
  { id: 'species-creator', url: '/species-creator' },
  { id: 'creature-creator', url: '/creature-creator' },
  { id: 'empowered-technique-creator', url: '/empowered-technique-creator' },
  { id: 'encounters', url: '/encounters' },
  { id: 'crafting', url: '/crafting' },
  { id: 'campaigns', url: '/campaigns' },
  { id: 'styleguide', url: '/dev/styleguide' },
];

const PROBE = () => {
  const VIEWPORT_SLACK = 1;
  const MIN_TOUCH = 44;
  const isVisible = (el, r) =>
    r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .join('.');
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    const label = el.getAttribute('aria-label') || '';
    return (
      el.tagName.toLowerCase() +
      id +
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
    (el) => !el.closest('nextjs-portal'),
  );

  const overflowRight = [];
  const textSpill = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (!isVisible(el, r)) continue;

    if (r.right > vw + VIEWPORT_SLACK || r.left < -VIEWPORT_SLACK) {
      const p = el.parentElement?.getBoundingClientRect();
      const parentOverflows = p && (p.right > vw + VIEWPORT_SLACK || p.left < -VIEWPORT_SLACK);
      // Inside a deliberate horizontal scroller this is expected, not a bug.
      const scroller = el.parentElement?.closest?.('*');
      const inScroller = (() => {
        let n = el.parentElement;
        while (n && n !== document.body) {
          if (/auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
          n = n.parentElement;
        }
        return false;
      })();
      if (!parentOverflows && !inScroller) {
        overflowRight.push({
          el: describe(el),
          rect: round(r),
          overhang: Math.round(r.right - vw),
        });
      }
      void scroller;
    }

    const cs = getComputedStyle(el);
    if (/auto|scroll/.test(cs.overflowX)) continue;
    const hasOwnText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
    );
    if (hasOwnText && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      textSpill.push({
        el: describe(el),
        clientW: el.clientWidth,
        scrollW: el.scrollWidth,
        overflowX: cs.overflowX,
        textOverflow: cs.textOverflow,
        whiteSpace: cs.whiteSpace,
        clipped: cs.overflowX === 'hidden' && cs.textOverflow !== 'ellipsis',
        rect: round(r),
      });
    }
  }

  const INTERACTIVE =
    'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=link], [role=checkbox], [role=switch], [tabindex]:not([tabindex="-1"])';
  const controls = Array.from(document.querySelectorAll(INTERACTIVE))
    .filter((el) => !el.closest('nextjs-portal'))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => isVisible(el, r));

  const tooSmall = [];
  const oversized = [];
  for (const { el, r } of controls) {
    if (r.width < MIN_TOUCH - 0.5 || r.height < MIN_TOUCH - 0.5) {
      tooSmall.push({ el: describe(el), rect: round(r) });
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const ink = range.getBoundingClientRect();
    if (ink.width > 0 && r.width - ink.width > 40 && r.width > 88) {
      oversized.push({
        el: describe(el),
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
          a: describe(a.el),
          b: describe(b.el),
          overlap: { w: Math.round(ox), h: Math.round(oy) },
          rects: [round(a.r), round(b.r)],
        });
      }
    }
  }

  return {
    viewport: { w: vw, h: window.innerHeight },
    docScrollWidth: document.documentElement.scrollWidth,
    horizontalPageScroll: document.documentElement.scrollWidth > vw + VIEWPORT_SLACK,
    counts: {
      overflowRight: overflowRight.length,
      textSpill: textSpill.length,
      textClipped: textSpill.filter((t) => t.clipped).length,
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

async function runActions(page, actions, notes) {
  for (const action of actions ?? []) {
    try {
      if (action.firstListRow) {
        const row = page
          .locator(
            '[data-testid="grid-list-row"], [class*="grid-list-row"], li button, [role="button"]',
          )
          .first();
        await row.click({ timeout: 4000 });
      } else if (action.role) {
        await page.getByRole(action.role, { name: action.name }).first().click({ timeout: 4000 });
      } else if (action.selector) {
        await page.locator(action.selector).first().click({ timeout: 4000 });
      }
      await page.waitForTimeout(700);
    } catch (err) {
      notes.push(`action failed: ${JSON.stringify(action)} — ${err.message.split('\n')[0]}`);
    }
  }
}

async function main() {
  await mkdir(path.join(OUT, 'shots'), { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const size of WIDTHS) {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
    });
    // Hide the Next.js dev overlay so it never lands in a screenshot or probe.
    await context.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent =
        'nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none !important}';
      document.documentElement.appendChild(style);
    });

    for (const route of ROUTES) {
      if (ONLY && !route.id.includes(ONLY)) continue;
      const page = await context.newPage();
      const notes = [];
      const consoleErrors = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

      try {
        await page.goto(BASE + route.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(2500);
        await runActions(page, route.actions, notes);
        await page.waitForTimeout(300);

        const probe = await page.evaluate(PROBE);
        const shot = `${route.id}@${size.label}`;
        await page.screenshot({ path: path.join(OUT, 'shots', `${shot}.png`) });
        await page
          .screenshot({ path: path.join(OUT, 'shots', `${shot}-full.png`), fullPage: true })
          .catch(() => notes.push('full-page screenshot failed'));

        results.push({
          route: route.id,
          url: route.url,
          width: size.label,
          finalUrl: new URL(page.url()).pathname,
          shot: `shots/${shot}.png`,
          notes,
          consoleErrors: consoleErrors.slice(0, 3),
          ...probe,
        });
        console.log(
          `${route.id}@${size.label}  overflow:${probe.counts.overflowRight} spill:${probe.counts.textSpill} small:${probe.counts.tooSmall} big:${probe.counts.oversized} overlap:${probe.counts.overlaps} hScroll:${probe.horizontalPageScroll}`,
        );
      } catch (err) {
        results.push({
          route: route.id,
          url: route.url,
          width: size.label,
          error: err.message.split('\n')[0],
        });
        console.log(`${route.id}@${size.label}  ERROR ${err.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, 'findings.json'), JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} route results to ${path.join(OUT, 'findings.json')}`);
}

main();
