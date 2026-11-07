import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { ArchetypeFeatsStep } from './archetype-feats-step';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

const archetypeFeatCapOverride = vi.hoisted(() => ({ value: null as number | null }));

vi.mock('@/lib/game/formulas', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/game/formulas')>();
  return {
    ...mod,
    calculateMaxArchetypeFeats: (...args: Parameters<typeof mod.calculateMaxArchetypeFeats>) =>
      archetypeFeatCapOverride.value ?? mod.calculateMaxArchetypeFeats(...args),
  };
});

const baseDraft = {
  creatorEntryMode: 'custom' as const,
  archetypePathId: null,
  archetypeType: 'powered-martial' as const,
  archetypeFeatIds: ['1', '2'],
  characterFeatIds: [] as string[],
  abilities: { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
  skills: [],
  mart_abil: null,
};

let rulesState: { rules: Partial<CoreRulesMap> | undefined; isLoading: boolean } = {
  rules: getGameRulesFallback(),
  isLoading: false,
};

vi.mock('@/stores/guided-creator-store', () => ({
  useGuidedCreatorStore: () => ({
    draft: baseDraft,
    updateDraft: vi.fn(),
    navigationIntent: null,
    entryNonce: 0,
    prevSubStep: vi.fn(),
    nextSubStep: vi.fn(),
  }),
}));

vi.mock('../use-guided-path-data', () => ({
  useGuidedPathData: () => ({ pathData: null, archetype: { name: 'Test Path' } }),
}));

vi.mock('@/lib/guided-creator/use-guided-deep-entry-on-arrival', () => ({
  useGuidedDeepEntryOnArrival: () => {},
}));

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useCodexFeats: () => ({
      data: [
        { id: '1', name: 'Feat One', description: 'One' },
        { id: '2', name: 'Feat Two', description: 'Two' },
        { id: '3', name: 'Feat Three', description: 'Three' },
      ],
      isLoading: false,
    }),
    useCodexSkills: () => ({ data: [], isLoading: false }),
    useGameRules: () => rulesState,
    usePathListFilter: () => ({
      selectedPathIds: [],
      setSelectedPathIds: vi.fn(),
      pathIndex: { options: [] },
      pathFilterActive: false,
    }),
  };
});

function renderStep() {
  return renderToStaticMarkup(<ArchetypeFeatsStep />);
}

function expectContinueUsable(html: string) {
  expect(html).toContain('Continue');
  const continueMatch = html.match(/<button[^>]*>Continue<\/button>/i);
  expect(continueMatch).toBeTruthy();
  expect(continueMatch?.[0]).not.toMatch(/\sdisabled(?:=""|=\{true\}|(?=\s|>))/);
}

function expectNoFeatLimitWarnings(html: string) {
  expect(html).not.toContain('Deselect some');
  expect(html).not.toContain(l2Copy.overLimitZero);
  expect(html).not.toMatch(/more than the limit/i);
}

describe('ArchetypeFeatsStep advisory feat caps', () => {
  beforeEach(() => {
    archetypeFeatCapOverride.value = null;
    rulesState = { rules: getGameRulesFallback(), isLoading: false };
    baseDraft.archetypeFeatIds = ['1', '2'];
  });

  afterEach(() => {
    archetypeFeatCapOverride.value = null;
  });

  it('keeps Continue enabled after rules load with a higher DB cap than the fallback', () => {
    rulesState = {
      isLoading: false,
      rules: {
        ...getGameRulesFallback(),
        ARCHETYPES: {
          ...getGameRulesFallback().ARCHETYPES,
          configs: {
            ...getGameRulesFallback().ARCHETYPES.configs,
            'powered-martial': {
              ...getGameRulesFallback().ARCHETYPES.configs['powered-martial'],
              featLimit: 4,
            },
          },
        },
      } as CoreRulesMap,
    };
    const html = renderStep();
    expectContinueUsable(html);
    expectNoFeatLimitWarnings(html);
    expect(html).toContain('2 / 5');
  });

  it('keeps Continue enabled when the advisory cap drops below the selected count', () => {
    baseDraft.archetypeFeatIds = ['1', '2', '3'];
    rulesState = {
      isLoading: false,
      rules: {
        ...getGameRulesFallback(),
        ARCHETYPES: {
          ...getGameRulesFallback().ARCHETYPES,
          configs: {
            ...getGameRulesFallback().ARCHETYPES.configs,
            'powered-martial': {
              ...getGameRulesFallback().ARCHETYPES.configs['powered-martial'],
              featLimit: 0,
            },
          },
        },
      } as CoreRulesMap,
    };
    const html = renderStep();
    expectContinueUsable(html);
    expectNoFeatLimitWarnings(html);
    expect(html).toContain('3 / 1');
  });

  it('keeps Continue enabled while core_rules are still loading (codex already loaded)', () => {
    rulesState = { rules: getGameRulesFallback(), isLoading: true };
    const html = renderStep();
    expectContinueUsable(html);
    expectNoFeatLimitWarnings(html);
  });

  it('keeps Continue enabled with a zero advisory cap and existing selections', () => {
    archetypeFeatCapOverride.value = 0;
    baseDraft.archetypeFeatIds = ['1'];
    const html = renderStep();
    expectContinueUsable(html);
    expectNoFeatLimitWarnings(html);
    expect(html).toContain('1 / 0');
  });
});
