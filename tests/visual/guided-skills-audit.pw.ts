import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.guided-skills-audit');

const COMPLETED_BEFORE_SKILLS = ['path', 'species', 'ancestry', 'abilities'] as const;

function seedGuidedStorage(subStep: string, draft: Record<string, unknown>) {
  return {
    state: {
      currentSubStep: subStep,
      completedSubSteps: [...COMPLETED_BEFORE_SKILLS],
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

async function snap(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test('guided skills step UX audit screenshots', async ({ page, context }) => {
  await context.addInitScript(themeInit('light'), 'light');

  const storage = seedGuidedStorage('skills', {
    archetypePathId: '1',
    archetypeType: 'martial',
    mart_abil: 'strength',
    speciesId: '4',
    speciesName: 'Human',
    skills: { '1': 0, '2': 0 },
  });

  await page.addInitScript((payload) => {
    localStorage.setItem('guided-creator-storage', JSON.stringify(payload));
  }, storage);

  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await snap(page, '01-skills-desktop');

  await page.setViewportSize({ width: 360, height: 800 });
  await snap(page, '02-skills-mobile');

  const abilitiesStorage = seedGuidedStorage('abilities', {
    archetypePathId: '1',
    archetypeType: 'martial',
    mart_abil: 'strength',
    speciesId: '4',
    speciesName: 'Human',
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript((payload) => {
    localStorage.setItem('guided-creator-storage', JSON.stringify(payload));
  }, abilitiesStorage);
  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });
  await snap(page, '03-abilities-desktop-compare');
});
