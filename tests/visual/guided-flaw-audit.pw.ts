import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit } from './targets';

const OUT_DIR = path.join(process.cwd(), '.guided-flaw-audit');

function seedGuidedStorage(subStep: string, draft: Record<string, unknown>) {
  return {
    state: {
      currentSubStep: subStep,
      completedSubSteps: ['path', 'species'],
      draft: {
        archetypePathId: '1',
        archetypeType: 'martial',
        pow_abil: null,
        mart_abil: 'strength',
        speciesId: '4',
        speciesName: 'Human',
        selectedSize: 'medium',
        selectedSpeciesTraitChoices: {},
        selectedAncestryTraitIds: ['1'],
        selectedCharacteristicId: '2',
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
        loadoutId: null,
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
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage,
  });
}

test('guided ancestry flaw step skip affordance audit', async ({ page, context }) => {
  await context.addInitScript(themeInit('light'), 'light');

  const storage = seedGuidedStorage('ancestry', {});

  await page.addInitScript((payload) => {
    localStorage.setItem('guided-creator-storage', JSON.stringify(payload));
  }, storage);

  await page.goto('/characters/new/guided', { waitUntil: 'networkidle' });

  // Seed lands mid-ancestry; advance to flaw phase if overview/picks appear first.
  const flawHeading = page.getByRole('heading', { name: /take a flaw/i });
  for (let i = 0; i < 8 && !(await flawHeading.isVisible().catch(() => false)); i++) {
    const next = page.getByRole('button', { name: /next pick|continue|begin/i }).first();
    if (await next.isEnabled().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(350);
    } else {
      break;
    }
  }

  await flawHeading.waitFor({ timeout: 45_000 });
  await snap(page, '01-flaw-full-page');
  await snap(page, '02-flaw-skip-area', false);

  // Choice cards are focusable divs (aria-label), not native buttons.
  const skipCard = page.getByLabel(/^Skip — no flaw$/i);
  await skipCard.click();
  await page.waitForTimeout(300);
  await snap(page, '04-skip-selected');

  await page.setViewportSize({ width: 360, height: 800 });
  await snap(page, '03-flaw-mobile');
});
