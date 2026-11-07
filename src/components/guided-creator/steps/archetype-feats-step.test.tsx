import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import { ArchetypeFeatsStep } from './archetype-feats-step';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;

const updateDraft = vi.fn();

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

vi.mock('@/lib/utils/stabilize-vertical-scroll', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/stabilize-vertical-scroll')>();
  return {
    ...actual,
    stabilizeVerticalScroll: () => {},
    nearestVerticalScroller: () => null,
  };
});

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

let syncLayoutEffects = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useLayoutEffect: (effect: () => void | (() => void)) => {
      if (syncLayoutEffects) {
        effect();
      }
    },
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

describe('ArchetypeFeatsStep guided feat cap', () => {
  beforeEach(() => {
    syncLayoutEffects = false;
    updateDraft.mockClear();
    rulesState = { rules: getGameRulesFallback(), isLoading: false };
    baseDraft.archetypeType = 'powered-martial';
    baseDraft.archetypeFeatIds = ['1'];
  });

  afterEach(() => {
    syncLayoutEffects = false;
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
    baseDraft.archetypeFeatIds = ['1', '2'];
    expectContinueUsable(renderStep());

    baseDraft.archetypeFeatIds = ['1', '2', '3'];
    expectContinueBlocked(renderStep());
  });

  it('trims restored over-cap drafts via layout reconciliation', () => {
    syncLayoutEffects = true;
    baseDraft.creatorEntryMode = 'guided';
    baseDraft.archetypePathId = 'path-1';
    baseDraft.archetypeFeatIds = ['1', '2', '3'];
    renderStep();
    expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: ['1', '2'] });
  });

  it('raises the displayed cap when DB rules grant more archetype feats (martial)', () => {
    baseDraft.archetypeType = 'martial';
    baseDraft.archetypeFeatIds = ['1', '2'];
    const cap = calculateMaxArchetypeFeats(1, 'martial', getGameRulesFallback());
    const html = renderStep();
    expect(cap).toBe(3);
    expect(html).toContain(`2 / ${cap}`);
    expect(html).toContain(stepCopy.underLimit(1));
    expectContinueUsable(html);
  });

  it('shrinks the effective cap when archetype type changes (powered-martial → power)', () => {
    baseDraft.archetypeType = 'power';
    baseDraft.archetypeFeatIds = ['1', '2'];
    const cap = calculateMaxArchetypeFeats(1, 'power', getGameRulesFallback());
    expect(cap).toBe(1);
    expectContinueBlocked(renderStep());
  });
});
