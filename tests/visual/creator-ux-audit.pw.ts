import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { themeInit, type ThemeName } from './targets';

const OUT_DIR = path.join(process.cwd(), '.creator-audit-screenshots');

const DEFAULT_ABILITIES = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

type CreatorStep =
  | 'archetype'
  | 'species'
  | 'ancestry'
  | 'abilities'
  | 'skills'
  | 'feats'
  | 'equipment'
  | 'powers'
  | 'finalize';

const STEP_ORDER: CreatorStep[] = [
  'archetype',
  'species',
  'ancestry',
  'abilities',
  'skills',
  'feats',
  'equipment',
  'powers',
  'finalize',
];

function stepsBefore(step: CreatorStep): CreatorStep[] {
  const idx = STEP_ORDER.indexOf(step);
  return STEP_ORDER.slice(0, idx);
}

function seedCreatorStorage(
  step: CreatorStep,
  draft: Record<string, unknown>,
  stepLayer: Record<string, number> = {},
  completedSteps: CreatorStep[] = stepsBefore(step)
) {
  return {
    state: {
      currentStep: step,
      completedSteps,
      stepLayer,
      draft: {
        name: 'Audit Hero',
        level: 1,
        abilities: { ...DEFAULT_ABILITIES },
        step: 0,
        isComplete: false,
        currency: 200,
        creationMode: 'path',
        ...draft,
      },
    },
    version: 2,
  };
}

async function snap(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.evaluate(() => (document as Document).fonts?.ready);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

const VIEWPORTS = [
  { tag: 'desktop', width: 1280, height: 900 },
  { tag: 'mobile', width: 360, height: 800 },
] as const;

const THEMES: ThemeName[] = ['light', 'dark'];

const pathDraft = {
  creationMode: 'path',
  archetype: {
    id: '1',
    name: 'Berserker',
    type: 'martial',
    archetype_ability: 'strength',
    secondary_ability: 'vitality',
    mart_abil: 'strength',
  },
  archetypePathId: '1',
  mart_abil: 'strength',
  ancestry: { id: '4', name: 'Human', selectedTraits: [], mixed: false },
  species: 'Human',
};

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    test.describe(`${vp.tag} · ${theme}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('archetype path + forge', async ({ page, context }) => {
        await context.addInitScript(themeInit(theme), theme);
        await page.goto('/characters/new', { waitUntil: 'networkidle' });
        await snap(page, `${vp.tag}-${theme}-01-archetype-path`);

        await page.getByRole('button', { name: /Forge your own/i }).click();
        await page.waitForTimeout(300);
        await snap(page, `${vp.tag}-${theme}-02-archetype-forge`);
      });

      test('creator steps (seeded martial path)', async ({ page, context }) => {
        await context.addInitScript(themeInit(theme), theme);

        const scenarios: Array<{ step: CreatorStep; layer?: number; suffix?: string }> = [
          { step: 'species' },
          { step: 'ancestry' },
          { step: 'abilities' },
          { step: 'abilities', layer: 2, suffix: 'layer2' },
          { step: 'skills' },
          { step: 'skills', layer: 2, suffix: 'layer2' },
          { step: 'feats' },
          { step: 'feats', layer: 2, suffix: 'layer2' },
          { step: 'equipment' },
          { step: 'equipment', layer: 2, suffix: 'layer2' },
          { step: 'finalize' },
        ];

        for (const { step, layer, suffix } of scenarios) {
          const stepLayer = layer ? { [step]: layer } : {};
          const storage = seedCreatorStorage(step, pathDraft, stepLayer);
          await page.addInitScript((payload) => {
            localStorage.setItem('character-creator-storage', JSON.stringify(payload));
          }, storage);
          await page.goto('/characters/new', { waitUntil: 'networkidle' });
          const tag = suffix ? `${step}-${suffix}` : step;
          await snap(page, `${vp.tag}-${theme}-step-${tag}`);
        }
      });

      test('tab bar + footer chrome', async ({ page, context }) => {
        await context.addInitScript(themeInit(theme), theme);
        const storage = seedCreatorStorage('skills', pathDraft, {}, stepsBefore('skills'));
        await page.addInitScript((payload) => {
          localStorage.setItem('character-creator-storage', JSON.stringify(payload));
        }, storage);
        await page.goto('/characters/new', { waitUntil: 'networkidle' });
        const tabBar = page.locator('.overflow-x-auto').first();
        if (await tabBar.isVisible()) {
          await tabBar.screenshot({
            path: path.join(OUT_DIR, `${vp.tag}-${theme}-tab-bar.png`),
          });
        }
        const footer = page.getByTestId('creator-step-footer');
        if (await footer.isVisible()) {
          await footer.scrollIntoViewIfNeeded();
          await footer.screenshot({
            path: path.join(OUT_DIR, `${vp.tag}-${theme}-footer.png`),
          });
        }
      });
    });
  }
}
