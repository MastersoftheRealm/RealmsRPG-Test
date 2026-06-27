/**
 * Authenticated Playwright helpers (TASK-385).
 * Skips when E2E_TEST_EMAIL / E2E_TEST_PASSWORD are unset (local + CI without DEV-003).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';

import seedManifest from './e2e-seed-manifest.json';

export const AUTH_STORAGE_PATH = join(process.cwd(), 'tests', 'visual', '.auth', 'user.json');

export type AuthPageName =
  | 'my-account'
  | 'characters'
  | 'character-sheet'
  | 'campaigns'
  | 'campaign-detail';

export interface AuthPageDef {
  name: AuthPageName;
  path: string;
}

export const STATIC_AUTH_PAGES: AuthPageDef[] = [
  { name: 'my-account', path: '/my-account' },
  { name: 'characters', path: '/characters' },
  { name: 'campaigns', path: '/campaigns' },
];

export interface ResolvedAuthPaths {
  characterId: string;
  campaignId: string;
}

export function hasAuthCredentials(): boolean {
  return Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}

export function resolveAuthPathsFromEnv(): ResolvedAuthPaths {
  return {
    characterId: process.env.E2E_TEST_CHARACTER_ID ?? seedManifest.characterId,
    campaignId: process.env.E2E_TEST_CAMPAIGN_ID ?? seedManifest.campaignId,
  };
}

export function buildAuthScreenshotPages(paths: ResolvedAuthPaths): AuthPageDef[] {
  return [
    ...STATIC_AUTH_PAGES,
    { name: 'character-sheet', path: `/characters/${paths.characterId}` },
    { name: 'campaign-detail', path: `/campaigns/${paths.campaignId}` },
  ];
}

/** Log in via /login and wait for redirect away from auth routes. */
export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set');
  }

  await page.goto('/login', { waitUntil: 'load' });
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

/** Wait for authenticated data surfaces to finish loading skeletons. */
export async function waitForAuthPageReady(page: Page, pageName: AuthPageName): Promise<void> {
  switch (pageName) {
    case 'my-account':
      await page.getByRole('heading', { name: /my account/i }).waitFor({ timeout: 30_000 });
      break;
    case 'characters':
      await page.getByRole('heading', { name: /^characters$/i }).waitFor({ timeout: 30_000 });
      await page.getByText('Loading...').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);
      break;
    case 'character-sheet':
      await page.getByText('Loading character...').waitFor({ state: 'hidden', timeout: 45_000 });
      await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
      break;
    case 'campaigns':
      await page.getByRole('heading', { name: /^campaigns$/i }).waitFor({ timeout: 30_000 });
      break;
    case 'campaign-detail':
      await page.getByText('Loading campaign...').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => undefined);
      await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
      break;
    default:
      break;
  }

  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(350);
}

/**
 * Mask volatile regions (portraits, roll logs) so baselines don't churn on data drift.
 */
export function screenshotMasks(page: Page, pageName: AuthPageName): Locator[] {
  const masks: Locator[] = [
    page.locator('img[src*="storage"], img[src*="supabase.co/storage"]'),
  ];

  if (pageName === 'campaign-detail') {
    masks.push(page.locator('.max-h-\\[400px\\].overflow-y-auto').first());
  }

  if (pageName === 'character-sheet') {
    masks.push(page.locator('[class*="roll-log"], [class*="RollLog"]').first());
  }

  return masks;
}

export function loadAuthA11yBaseline(): Set<string> {
  const baselinePath = join(process.cwd(), 'tests', 'visual', 'auth-a11y-baseline.json');
  try {
    const parsed = JSON.parse(readFileSync(baselinePath, 'utf8')) as { allowed?: string[] };
    return new Set(parsed.allowed ?? []);
  } catch {
    return new Set();
  }
}

export function authA11yKeyFor(path: string, theme: string, ruleId: string): string {
  return `${path}|${theme}|${ruleId}`;
}

export const isAuthA11yUpdateMode = !!process.env.UPDATE_AUTH_A11Y_BASELINE;

export function recordAuthA11yKeys(keys: string[]): void {
  const baselinePath = join(process.cwd(), 'tests', 'visual', 'auth-a11y-baseline.json');
  const current = loadAuthA11yBaseline();
  for (const k of keys) current.add(k);
  const sorted = [...current].sort();
  writeFileSync(baselinePath, JSON.stringify({ allowed: sorted }, null, 2) + '\n');
}
