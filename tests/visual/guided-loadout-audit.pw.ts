import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.guided-loadout-audit');

const COMPLETED_BEFORE_LOADOUT = [
  'path',
  'species',
  'ancestry',
  'abilities',
  'skills',
  'archetype-feats',
  'character-feat',
] as const;

function seedGuidedStorage(subStep: string, draft: Record<string, unknown>) {
  return {
    state: {
      currentSubStep: subStep,
      completedSubSteps: [...COMPLETED_BEFORE_LOADOUT],
      draft: {
        archetypePathId: null,
        archetypeType: null,
        pow_abil: null,
        mart_abil: null,
        speciesId: null,
        speciesName: null,
        selectedSize: null,
        selectedSpeciesTraitChoices: {},
        selectedAncestryTraitIds: [],
        selectedCharacteristicId: null,
        selectedFlawId: null,
        abilities: {
          strength: 3,
          vitality: 2,
          agility: 1,
          acuity: 1,
          intelligence: 0,
          charisma: 0,
        },
        abilitiesMode: 'recommended',
        skills: {},
        declinedPathSkillIds: [],
        archetypeFeatIds: [],
        characterFeatIds: [],
        equipmentPhase: 'weapon',
        loadoutWeapons: [],
        loadoutArmor: [],
        armaments: [],
        equipment: [],
        currency: null,
        unarmedProwess: 0,
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
    version: 5,
  };
}

async function snap(page: import('@playwright/test').Page, name: string, fullPage = true) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage,
  });
}

test('guided loadout phased equipment audit (TASK-442/443)', async ({ page, context }) => {
  await context.addInitScript(themeInit('light'), 'light');

  const storage = seedGuidedStorage('loadout', {
    archetypePathId: '1',
    archetypeType: 'martial',
    mart_abil: 'strength',
    speciesId: '4',
    speciesName: 'Human',
    skills: { '9': 0, '24': 0, '7': 0 },
    archetypeFeatIds: ['313'],
    characterFeatIds: ['1'],
  });

  await page.addInitScript((payload) => {
    localStorage.setItem('guided-creator-storage', JSON.stringify(payload));
  }, storage);

  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /your loadout/i }).waitFor({ timeout: 45_000 });

  await expect(page.getByRole('heading', { name: 'Quick kits', level: 3 })).toHaveCount(0);

  const phaseGroup = page.getByRole('group', { name: /equipment steps/i });
  await expect(phaseGroup).toBeVisible({ timeout: 15_000 });
  await expect(phaseGroup.getByRole('button', { name: /1\.\s*Weapons/i })).toBeVisible();
  await expect(phaseGroup.getByRole('button', { name: /2\.\s*Armor/i })).toBeVisible();
  await expect(phaseGroup.getByRole('button', { name: /3\.\s*Gear/i })).toBeVisible();

  await expect(page.getByText(/c remaining/i).first()).toBeVisible();

  await snap(page, '01-loadout-full-page');

  const battleaxeCard = page.getByLabel(/Select Battleaxe/i);
  if (await battleaxeCard.count()) {
    await battleaxeCard.first().click();
    await page.waitForTimeout(300);
    await snap(page, '02-weapon-l1-selected', false);
  }

  await page.getByRole('button', { name: 'See more' }).click();
  await page.getByRole('heading', { name: 'Browse weapons & shields', level: 2 }).waitFor({
    timeout: 15_000,
  });
  await page.waitForTimeout(400);
  await snap(page, '03-l2-weapons', false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: /Continue to armor/i }).click();
  await expect(page.getByRole('heading', { name: /^Armor$/i })).toBeVisible({ timeout: 15_000 });
  await snap(page, '04-armor-phase');

  await page.getByRole('button', { name: 'See more' }).click();
  await page.getByRole('heading', { name: 'Browse armor', level: 2 }).waitFor({ timeout: 15_000 });
  await snap(page, '05-l2-armor', false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: /Continue to Equipment/i }).click();
  await expect(page.getByRole('heading', { name: /^Equipment$/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: /Add all recommended Equipment/i })).toBeVisible();
  await expect(page.getByText(/Currency/i).first()).toBeVisible();
  await snap(page, '06-gear-phase');

  await page.getByRole('button', { name: 'See more' }).click();
  await page.getByRole('heading', { name: 'Browse Equipment', level: 2 }).waitFor({
    timeout: 15_000,
  });
  await snap(page, '07-l2-gear', false);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /^Equipment$/i }).waitFor({ timeout: 45_000 });
  await snap(page, '08-loadout-mobile');
});
