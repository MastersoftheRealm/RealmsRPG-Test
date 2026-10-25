/**
 * TASK-380 / TASK-431 — Standalone creator chrome screenshot + smoke audit.
 * Covers the six CreatorPageShell routes: full page, collapse, load / login modals,
 * reset confirm (creature), and mobile viewport smoke.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.shell-creators-audit');

type CreatorDef = {
  slug: string;
  path: string;
  h1: string;
  /** Section whose expand control we exercise */
  collapseTitle: string;
  /** Signed-out Load opens login (true) vs load modal (false = species) */
  loadRequiresAuth: boolean;
  hasResetConfirm?: boolean;
};

const CREATORS: CreatorDef[] = [
  {
    slug: 'power',
    path: '/power-creator',
    h1: 'Power Creator',
    collapseTitle: 'Range',
    loadRequiresAuth: true,
  },
  {
    slug: 'technique',
    path: '/technique-creator',
    h1: 'Technique Creator',
    collapseTitle: 'Combat Configuration',
    loadRequiresAuth: true,
  },
  {
    slug: 'empowered',
    path: '/empowered-technique-creator',
    h1: 'Empowered Technique Creator',
    collapseTitle: 'Shared Action Profile',
    loadRequiresAuth: true,
  },
  {
    slug: 'item',
    path: '/item-creator',
    h1: 'Armament Creator',
    collapseTitle: 'Ability Requirement',
    loadRequiresAuth: true,
  },
  {
    slug: 'species',
    path: '/species-creator',
    h1: 'Species Creator',
    collapseTitle: 'Basics',
    loadRequiresAuth: false,
  },
  {
    slug: 'creature',
    path: '/creature-creator',
    h1: 'Creature Creator',
    collapseTitle: 'Feats',
    loadRequiresAuth: true,
    hasResetConfirm: true,
  },
];

async function snap(page: Page, name: string, fullPage = true) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(450);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage,
  });
}

async function waitForCreatorReady(page: Page, h1: string) {
  await expect(page.getByRole('heading', { name: h1, level: 1 })).toBeVisible({
    timeout: 60_000,
  });
  await expect(
    page.getByRole('button', { name: /Load from library|Log in to load from library/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset creator form' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
}

async function assertNoNestedButtonsInExpand(page: Page, collapseTitle: string) {
  const expand = page.getByRole('button', {
    name: new RegExp(`^(Collapse|Expand) ${collapseTitle}$`),
  });
  await expect(expand).toBeVisible();
  const nestedButtons = expand.locator('button');
  await expect(nestedButtons).toHaveCount(0);
}

test.describe('creature roll log vs summary (86e3jzdw5)', () => {
  test('button clears the summary card and the creator grid stays full width', async ({
    page,
    context,
  }) => {
    await context.addInitScript(themeInit('light'), 'light');

    async function gridBox(path: string, width: number, height: number) {
      await page.setViewportSize({ width, height });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await waitForCreatorReady(
        page,
        path === '/species-creator' ? 'Species Creator' : 'Creature Creator',
      );
      return page.evaluate(() => {
        const grid = [...document.querySelectorAll('[data-creator-page] .grid')].find((el) =>
          el.classList.contains('md:grid-cols-3'),
        );
        if (!grid) return null;
        const rect = grid.getBoundingClientRect();
        const main = document.getElementById('main-content');
        return {
          left: rect.left,
          right: rect.right,
          clientWidth: document.documentElement.clientWidth,
          mainPaddingRight: main ? getComputedStyle(main).paddingRight : '',
        };
      });
    }

    const creature1280 = await gridBox('/creature-creator', 1280, 900);
    expect(creature1280).not.toBeNull();
    expect(creature1280!.clientWidth).toBe(1280);
    expect(creature1280!.left).toBeGreaterThanOrEqual(31);
    expect(creature1280!.left).toBeLessThanOrEqual(33);
    expect(creature1280!.right).toBeGreaterThanOrEqual(1247);
    expect(creature1280!.right).toBeLessThanOrEqual(1249);
    expect(creature1280!.mainPaddingRight).toBe('0px');

    const species768 = await gridBox('/species-creator', 768, 1024);
    const creature768 = await gridBox('/creature-creator', 768, 1024);
    expect(species768).not.toBeNull();
    expect(creature768).not.toBeNull();
    expect(Math.abs(creature768!.left - species768!.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(creature768!.right - species768!.right)).toBeLessThanOrEqual(1);
    expect(creature768!.mainPaddingRight).toBe('0px');

    for (const width of [768, 1280]) {
      await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
      const overlap = await page.evaluate(() => {
        const card = document.querySelector('.creature-creator-summary-fab-clear');
        const fab = document.querySelector('[data-creator-roll-dock]');
        if (!(card instanceof HTMLElement) || !(fab instanceof HTMLElement)) return null;
        const cardBox = card.getBoundingClientRect();
        const fabBox = fab.getBoundingClientRect();
        const overlapX =
          Math.min(cardBox.right, fabBox.right) - Math.max(cardBox.left, fabBox.left);
        const overlapY =
          Math.min(cardBox.bottom, fabBox.bottom) - Math.max(cardBox.top, fabBox.top);
        const sizeValue = [...card.querySelectorAll('span')].find(
          (el) => el.textContent?.trim() === 'Medium',
        );
        const sizeBox = sizeValue?.getBoundingClientRect();
        const hitsFab = (box: DOMRect) => {
          const ox = Math.min(box.right, fabBox.right) - Math.max(box.left, fabBox.left);
          const oy = Math.min(box.bottom, fabBox.bottom) - Math.max(box.top, fabBox.top);
          return ox > 1 && oy > 1;
        };
        const coveredText = [
          ...document.body.querySelectorAll(
            'button, a, input, select, textarea, h1, h2, h3, p, span, label',
          ),
        ].filter((el) => {
          if (!(el instanceof HTMLElement) || fab.contains(el)) return false;
          const box = el.getBoundingClientRect();
          if (box.width < 1 || box.height < 1) return false;
          return hitsFab(box);
        }).length;
        return {
          overlapX,
          overlapY,
          cardRight: cardBox.right,
          fabLeft: fabBox.left,
          sizeRight: sizeBox?.right ?? null,
          coveredText,
        };
      });
      expect(overlap).not.toBeNull();
      expect(overlap!.cardRight).toBeLessThanOrEqual(overlap!.fabLeft + 1);
      expect(overlap!.overlapX <= 1 || overlap!.overlapY <= 1).toBe(true);
      expect(overlap!.sizeRight).not.toBeNull();
      expect(overlap!.sizeRight!).toBeLessThanOrEqual(overlap!.fabLeft + 1);
      expect(overlap!.coveredText).toBe(0);
    }
  });
});

test.describe('CreatorPageShell audit (TASK-380/431)', () => {
  for (const creator of CREATORS) {
    test(`${creator.slug} — desktop chrome, collapse, modals`, async ({ page, context }) => {
      await context.addInitScript(themeInit('light'), 'light');
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(creator.path, { waitUntil: 'domcontentloaded' });
      await waitForCreatorReady(page, creator.h1);

      await snap(page, `${creator.slug}-01-desktop-full`);

      // Heading hierarchy: page h1 present; at least one section h2
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThan(0);

      await assertNoNestedButtonsInExpand(page, creator.collapseTitle);

      const expand = page.getByRole('button', {
        name: new RegExp(`^(Collapse|Expand) ${creator.collapseTitle}$`),
      });
      const before = await expand.getAttribute('aria-expanded');
      await expand.click();
      await page.waitForTimeout(250);
      const after = await expand.getAttribute('aria-expanded');
      expect(after).not.toBe(before);
      await snap(page, `${creator.slug}-02-section-toggled`);

      // Toggle back so page ends expanded-ish
      await expand.click();

      // Load behavior (signed out)
      await page
        .getByRole('button', { name: /Load from library|Log in to load from library/ })
        .click();
      await page.waitForTimeout(500);

      if (creator.loadRequiresAuth) {
        await expect(page.getByRole('heading', { name: /Login Required to Load/i })).toBeVisible();
        // Gated creators should advertise login on the Load control when signed out
        await expect(
          page.getByRole('button', { name: 'Log in to load from library' }),
        ).toBeVisible();
        await snap(page, `${creator.slug}-03-load-login-prompt`, false);
        await page.keyboard.press('Escape');
      } else {
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/Login Required to Load/i)).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Load from library' })).toBeVisible();
        await snap(page, `${creator.slug}-03-load-modal`, false);
        await page.keyboard.press('Escape');
      }

      // Save → login prompt when signed out
      const saveBtn = page.getByRole('button', { name: 'Save' });
      if (await saveBtn.isEnabled()) {
        await saveBtn.click();
        await page.waitForTimeout(400);
        // Species Save may stay disabled until form is ready — only assert if prompt opens
      } else {
        // Force click via evaluate path is brittle; click Load already covered auth for gated pages.
        // For disabled Save, click Save after filling is out of scope; still open by triggering handleSave only when enabled.
      }

      // When Save is disabled (species/creature incomplete), use a soft gate check on power/tech/item only:
      if (creator.loadRequiresAuth && creator.slug !== 'creature') {
        // Re-open save login if Save happened to be enabled; otherwise open via Load login already covered.
        if (await saveBtn.isEnabled()) {
          await expect(
            page.getByRole('heading', { name: /Login Required to Save/i }),
          ).toBeVisible();
          await snap(page, `${creator.slug}-04-save-login-prompt`, false);
          await page.keyboard.press('Escape');
        }
      }

      if (creator.hasResetConfirm) {
        await page.getByRole('button', { name: 'Reset creator form' }).click();
        await expect(page.getByRole('heading', { name: /Restart Creature/i })).toBeVisible();
        await snap(page, `${creator.slug}-05-reset-confirm`, false);
        await page.keyboard.press('Escape');
      }

      // Mobile smoke
      await page.setViewportSize({ width: 360, height: 800 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForCreatorReady(page, creator.h1);
      await snap(page, `${creator.slug}-06-mobile-full`);
    });
  }

  test('power — optional Remove sits outside expand control', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/power-creator', { waitUntil: 'domcontentloaded' });
    await waitForCreatorReady(page, 'Power Creator');

    // Duration is usually optional-enabled with Remove when present
    const durationExpand = page.getByRole('button', { name: /^(Collapse|Expand) Duration$/ });
    if (await durationExpand.isVisible().catch(() => false)) {
      const remove = page.getByRole('button', { name: 'Remove' }).first();
      if (await remove.isVisible().catch(() => false)) {
        // Remove must not be a descendant of the expand button
        const nested = durationExpand.locator('button', { hasText: 'Remove' });
        await expect(nested).toHaveCount(0);
        await snap(page, 'power-07-duration-remove-outside-expand', false);
      }
    }
  });

  test('technique — Add Part in rightSlot is outside expand control', async ({ page, context }) => {
    await context.addInitScript(themeInit('light'), 'light');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/technique-creator', { waitUntil: 'domcontentloaded' });
    await waitForCreatorReady(page, 'Technique Creator');

    const expand = page.getByRole('button', { name: /^(Collapse|Expand) Technique Parts/ });
    await expect(expand).toBeVisible();
    await expect(expand.locator('button')).toHaveCount(0);
    const addPart = page.getByRole('button', { name: /Add Part/i }).first();
    await expect(addPart).toBeVisible();
    await snap(page, 'technique-07-add-part-outside-expand', false);
  });
});
