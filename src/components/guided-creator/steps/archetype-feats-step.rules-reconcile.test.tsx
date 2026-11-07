// @vitest-environment happy-dom

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { ArchetypeFeatsStep } from './archetype-feats-step';

const updateDraft = vi.fn();

function withPoweredMartialFeatLimit(rules: CoreRulesMap, featLimit: number): CoreRulesMap {
  const cfg = rules.ARCHETYPES.configs['powered-martial']!;
  return {
    ...rules,
    ARCHETYPES: {
      ...rules.ARCHETYPES,
      configs: {
        ...rules.ARCHETYPES.configs,
        'powered-martial': { ...cfg, featLimit },
      },
    },
  };
}

let draft: GuidedDraft;

function resetDraft(overrides: Partial<GuidedDraft> = {}) {
  return {
    creatorEntryMode: 'guided',
    archetypePathId: 'path-1',
    archetypeType: 'powered-martial',
    archetypeFeatIds: ['1'],
    characterFeatIds: [],
    ...overrides,
  } as GuidedDraft;
}

let rulesState: { rules: CoreRulesMap; isLoading: boolean } = {
  rules: getGameRulesFallback(),
  isLoading: false,
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

describe('ArchetypeFeatsStep rules loading reconciliation', () => {
  beforeEach(async () => {
    updateDraft.mockClear();
    rulesState = { rules: getGameRulesFallback(), isLoading: false };
    const mod = await vi.importActual<typeof import('@/stores/guided-creator-store')>(
      '@/stores/guided-creator-store',
    );
    draft = { ...mod.useGuidedCreatorStore.getState().draft, ...resetDraft() };
  });

  it('does not trim while rules are loading (fallback cap), then keeps picks when live cap is higher', async () => {
    draft.archetypeFeatIds = ['1', '2', '3'];
    const fallbackCap = calculateMaxArchetypeFeats(1, 'powered-martial', getGameRulesFallback());
    expect(fallbackCap).toBe(2);

    rulesState = { rules: getGameRulesFallback(), isLoading: true };
    const { rerender } = render(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalled();
    });

    const liveRules = withPoweredMartialFeatLimit(getGameRulesFallback(), 2);
    const liveCap = calculateMaxArchetypeFeats(1, 'powered-martial', liveRules);
    expect(liveCap).toBe(3);

    rulesState = { rules: liveRules, isLoading: false };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalledWith({ archetypeFeatIds: ['1', '2'] });
    });
  });

  it('trims when resolved rules enforce a lower cap', async () => {
    draft.archetypeType = 'power';
    draft.archetypeFeatIds = ['1', '2'];
    rulesState = { rules: getGameRulesFallback(), isLoading: false };

    render(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: ['1'] });
    });
  });

  it('reconciles after a DB override tightens the cap post-load', async () => {
    draft.archetypeFeatIds = ['1', '2'];
    rulesState = { rules: getGameRulesFallback(), isLoading: true };
    const { rerender } = render(<ArchetypeFeatsStep />);
    expect(updateDraft).not.toHaveBeenCalled();

    const tighter = withPoweredMartialFeatLimit(getGameRulesFallback(), 0);
    rulesState = { rules: tighter, isLoading: false };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: ['1'] });
    });
  });

  it('trims all picks when resolved cap transitions to zero', async () => {
    draft.archetypeFeatIds = ['1'];
    rulesState = { rules: getGameRulesFallback(), isLoading: true };
    const { rerender } = render(<ArchetypeFeatsStep />);
    expect(updateDraft).not.toHaveBeenCalled();

    const zeroCapRules = withPoweredMartialFeatLimit(getGameRulesFallback(), -1);
    expect(calculateMaxArchetypeFeats(1, 'powered-martial', zeroCapRules)).toBe(0);

    rulesState = { rules: zeroCapRules, isLoading: false };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: [] });
    });
  });
});
