import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { ArchetypeFeatsStep } from './archetype-feats-step';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;

const updateDraft = vi.fn();

let draft: GuidedDraft;

const refetchRules = vi.fn();

let rulesState: {
  rules: CoreRulesMap;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
} = {
  rules: getGameRulesFallback(),
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: refetchRules,
};

vi.mock('@/stores/guided-creator-store', () => ({
  useGuidedCreatorStore: () => ({
    draft,
    updateDraft,
    navigationIntent: null,
    entryNonce: 0,
    prevSubStep: vi.fn(),
    nextSubStep: vi.fn(),
  }),
}));

vi.mock('../use-guided-path-data', () => ({
  useGuidedPathData: () => ({
    pathData: { level1: { guidance_groups: [], feats: ['1', '2', '3'] } },
    archetype: { name: 'Test Path' },
  }),
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

function expectContinueBlocked(html: string) {
  const continueMatch = html.match(/<button[^>]*>Continue<\/button>/i);
  expect(continueMatch).toBeTruthy();
  expect(continueMatch?.[0]).toMatch(/\sdisabled(?:=""|=\{true\}|(?=\s|>))/);
}

function resetDraft(overrides: Partial<GuidedDraft> = {}) {
  return {
    creatorEntryMode: 'custom',
    archetypePathId: null,
    archetypeType: 'powered-martial',
    archetypeFeatIds: ['1'],
    characterFeatIds: [],
    ...overrides,
  } as GuidedDraft;
}

describe('ArchetypeFeatsStep guided feat cap', () => {
  beforeEach(async () => {
    updateDraft.mockClear();
    refetchRules.mockClear();
    rulesState = {
      rules: getGameRulesFallback(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchRules,
    };
    const mod = await vi.importActual<typeof import('@/stores/guided-creator-store')>(
      '@/stores/guided-creator-store',
    );
    draft = { ...mod.useGuidedCreatorStore.getState().draft, ...resetDraft() };
  });

  it('uses the real L1 powered-martial cap from game rules (2 slots)', () => {
    const cap = calculateMaxArchetypeFeats(1, 'powered-martial', getGameRulesFallback());
    expect(cap).toBe(2);
    const html = renderStep();
    expect(html).toContain(`1 / ${cap}`);
    expect(html).toContain(stepCopy.underLimit(1));
    expectContinueUsable(html);
  });

  it('keeps Continue enabled when under the cap but disabled when over until reconciled', () => {
    draft.archetypeFeatIds = ['1', '2'];
    expectContinueUsable(renderStep());

    draft.archetypeFeatIds = ['1', '2', '3'];
    expectContinueBlocked(renderStep());
  });

  it('raises the displayed cap when DB rules grant more archetype feats (martial)', () => {
    draft = { ...draft, ...resetDraft({ archetypeType: 'martial', archetypeFeatIds: ['1', '2'] }) };
    const cap = calculateMaxArchetypeFeats(1, 'martial', getGameRulesFallback());
    const html = renderStep();
    expect(cap).toBe(3);
    expect(html).toContain(`2 / ${cap}`);
    expect(html).toContain(stepCopy.underLimit(1));
    expectContinueUsable(html);
  });

  it('shrinks the effective cap when archetype type changes (powered-martial → power)', () => {
    draft = { ...draft, ...resetDraft({ archetypeType: 'power', archetypeFeatIds: ['1', '2'] }) };
    const cap = calculateMaxArchetypeFeats(1, 'power', getGameRulesFallback());
    expect(cap).toBe(1);
    expectContinueBlocked(renderStep());
  });

  it('blocks Continue while game rules are still loading', () => {
    rulesState = {
      rules: getGameRulesFallback(),
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: refetchRules,
    };
    expectContinueBlocked(renderStep());
  });

  it('blocks Continue when rules failed and only fallback values are available', () => {
    rulesState = {
      rules: getGameRulesFallback(),
      isLoading: false,
      isFetching: false,
      error: new Error('core rules request failed'),
      refetch: refetchRules,
    };
    draft.archetypeFeatIds = ['1', '2', '3'];
    const html = renderStep();
    expectContinueBlocked(html);
    expect(html).toContain('load game rules for this step');
    expect(html).toContain('Retry');
    expect(updateDraft).not.toHaveBeenCalled();
  });
});
