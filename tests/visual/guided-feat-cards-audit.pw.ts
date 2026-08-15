import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.guided-feat-cards-audit');

const COMPLETED_BEFORE_ARCHETYPE_FEATS = [
  'path',
  'species',
  'ancestry',
  'abilities',
  'skills',
] as const;

function seedGuidedStorage(subStep: string, draft: Record<string, unknown>) {
  return {
    state: {
      currentSubStep: subStep,
      completedSubSteps: [...COMPLETED_BEFORE_ARCHETYPE_FEATS],
      draft: {
        archetypePathId: null,
        archetypeType: null,
        pow_abil: null,
        mart_abil: null,
        speciesId: null,
        speciesName: null,
        selectedSpeciesTraitChoices: {},
        selectedAncestryTraitIds: [],
        selectedCharacteristicId: null,
        selectedFlawId: null,
        abilities: {
          strength: 2,
          vitality: 2,
          agility: 0,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
        abilitiesMode: 'recommended',
        skills: {},
        declinedPathSkillIds: [],
        archetypeFeatIds: [],
        characterFeatIds: [],
        armaments: [],
        equipment: [],
        powerIds: [],
        techniqueIds: [],
        name: '',
        age: '',
        heightCm: null,
        weightKg: null,
        appearanceNotes: '',
        portraitUrl: null,
        hpAllocated: null,
        energyAllocated: null,
        ...draft,
      },
    },
    version: 3,
  };
}

async function snap(page: import('@playwright/test').Page, name: string, fullPage = true) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage,
  });
}

test('guided archetype feat card height audit', async ({ page, context }) => {
  await context.addInitScript(themeInit('light'), 'light');

  const storage = seedGuidedStorage('archetype-feats', {
    archetypePathId: '1',
    archetypeType: 'martial',
    mart_abil: 'strength',
    speciesId: '4',
    speciesName: 'Human',
    skills: { '9': 0, '24': 0, '7': 0 },
  });

  await page.addInitScript((payload) => {
    localStorage.setItem('guided-creator-storage', JSON.stringify(payload));
  }, storage);

  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: /how you excel in combat/i })
    .waitFor({ timeout: 30_000 });

  await snap(page, '01-archetype-feats-full-page');

  const firstGroup = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 3 }) })
    .first();
  await firstGroup.scrollIntoViewIfNeeded();
  await snap(page, '02-first-feat-group-cards', false);

  await page.getByRole('heading', { name: 'Reckless Attack' }).scrollIntoViewIfNeeded();
  const reckless = page.locator('[aria-label="Select Reckless Attack"]');
  const rapid = page.locator('[aria-label="Select Rapid Recovery"]');
  const boxA = await reckless.boundingBox();
  const boxB = await rapid.boundingBox();
  if (boxA && boxB) {
    expect(Math.abs(boxA.height - boxB.height)).toBeLessThanOrEqual(2);
    const x = Math.min(boxA.x, boxB.x) - 16;
    const y = Math.min(boxA.y, boxB.y) - 8;
    const width = Math.max(boxA.x + boxA.width, boxB.x + boxB.width) - x + 16;
    const height = Math.max(boxA.y + boxA.height, boxB.y + boxB.height) - y + 8;
    await page.screenshot({
      path: path.join(OUT_DIR, '05-row-reckless-vs-rapid-recovery.png'),
      clip: { x, y, width, height },
    });
  }

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: /how you excel in combat/i })
    .waitFor({ timeout: 30_000 });
  await snap(page, '04-archetype-feats-mobile');
});
