import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { applyCappedIdSelection } from '@/lib/guided-creator/feat-selection';
import { ArchetypeFeatsStep } from './archetype-feats-step';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;

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
  archetypeFeatIds: ['1'] as string[],
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
  const continueMatch = html.match(/<button[^>]*>Continue<\/button>/i);
  expect(continueMatch).toBeTruthy();
  expect(continueMatch?.[0]).not.toMatch(/\sdisabled(?:=""|=\{true\}|(?=\s|>))/);
}

describe('ArchetypeFeatsStep guided feat cap', () => {
  beforeEach(() => {
    archetypeFeatCapOverride.value = 2;
    rulesState = { rules: getGameRulesFallback(), isLoading: false };
    baseDraft.archetypeFeatIds = ['1'];
  });

  afterEach(() => {
    archetypeFeatCapOverride.value = null;
  });

  it('blocks selecting more than the allowed count via capped selection', () => {
    expect(applyCappedIdSelection(['1', '2'], '3', 2)).toEqual(['1', '3']);
    expect(applyCappedIdSelection(['1', '2'], '4', 2)).toHaveLength(2);
  });

  it('shows an under-limit warning when fewer than max are picked but Continue stays enabled', () => {
    const html = renderStep();
    expect(html).toContain(stepCopy.underLimit(1));
    expectContinueUsable(html);
    expect(html).toContain('1 / 2');
  });

  it('hides the under-limit warning when the cap is filled', () => {
    baseDraft.archetypeFeatIds = ['1', '2'];
    const html = renderStep();
    expect(html).not.toContain(stepCopy.underLimit(1));
    expectContinueUsable(html);
  });

  it('keeps Continue enabled when DB rules raise the cap after fallback picks', () => {
    archetypeFeatCapOverride.value = 5;
    baseDraft.archetypeFeatIds = ['1', '2'];
    const html = renderStep();
    expectContinueUsable(html);
    expect(html).toContain('2 / 5');
    expect(html).toContain(stepCopy.underLimit(3));
  });
});
