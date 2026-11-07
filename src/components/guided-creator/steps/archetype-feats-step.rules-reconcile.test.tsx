// @vitest-environment happy-dom

import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { getGameRulesFallback } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateMaxArchetypeFeats } from '@/lib/game/formulas';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { ArchetypeFeatsStep } from './archetype-feats-step';

const stepCopy = GUIDED_CREATOR_COPY.steps.archetypeFeats;

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

type RulesHookState = {
  rules: CoreRulesMap;
  isLoading: boolean;
  error: Error | null;
};

let rulesState: RulesHookState = {
  rules: getGameRulesFallback(),
  isLoading: false,
  error: null,
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

vi.mock('@/components/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...mod,
    Modal: ({
      isOpen,
      title,
      description,
      footer,
      children,
    }: {
      isOpen: boolean;
      title?: ReactNode;
      description?: ReactNode;
      footer?: ReactNode;
      children?: ReactNode;
    }) =>
      isOpen ? (
        <div data-testid="feats-l2-modal">
          <div>{title}</div>
          <div>{description}</div>
          {children}
          {footer}
        </div>
      ) : null,
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

describe('ArchetypeFeatsStep rules loading reconciliation', () => {
  beforeEach(async () => {
    updateDraft.mockClear();
    rulesState = { rules: getGameRulesFallback(), isLoading: false, error: null };
    const mod = await vi.importActual<typeof import('@/stores/guided-creator-store')>(
      '@/stores/guided-creator-store',
    );
    draft = { ...mod.useGuidedCreatorStore.getState().draft, ...resetDraft() };
  });

  it('does not trim while rules are loading (fallback cap), then keeps picks when live cap is higher', async () => {
    draft.archetypeFeatIds = ['1', '2', '3'];
    const fallbackCap = calculateMaxArchetypeFeats(1, 'powered-martial', getGameRulesFallback());
    expect(fallbackCap).toBe(2);

    rulesState = { rules: getGameRulesFallback(), isLoading: true, error: null };
    const { rerender } = render(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalled();
    });

    const liveRules = withPoweredMartialFeatLimit(getGameRulesFallback(), 2);
    const liveCap = calculateMaxArchetypeFeats(1, 'powered-martial', liveRules);
    expect(liveCap).toBe(3);

    rulesState = { rules: liveRules, isLoading: false, error: null };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalledWith({ archetypeFeatIds: ['1', '2'] });
    });
  });

  it('does not trim on failed fetch (fallback + error), then keeps picks after a successful higher cap load', async () => {
    draft.archetypeFeatIds = ['1', '2', '3'];
    const fetchError = new Error('core rules request failed');

    rulesState = { rules: getGameRulesFallback(), isLoading: true, error: null };
    const { rerender } = render(<ArchetypeFeatsStep />);
    expect(updateDraft).not.toHaveBeenCalled();

    rulesState = { rules: getGameRulesFallback(), isLoading: false, error: fetchError };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalled();
    });

    const liveRules = withPoweredMartialFeatLimit(getGameRulesFallback(), 2);
    rulesState = { rules: liveRules, isLoading: false, error: null };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).not.toHaveBeenCalledWith({ archetypeFeatIds: ['1', '2'] });
    });
    expect(draft.archetypeFeatIds).toEqual(['1', '2', '3']);
  });

  it('trims when resolved rules enforce a lower cap', async () => {
    draft.archetypeType = 'power';
    draft.archetypeFeatIds = ['1', '2'];
    rulesState = { rules: getGameRulesFallback(), isLoading: false, error: null };

    render(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: ['1'] });
    });
  });

  it('reconciles after a DB override tightens the cap post-load', async () => {
    draft.archetypeFeatIds = ['1', '2'];
    rulesState = { rules: getGameRulesFallback(), isLoading: true, error: null };
    const { rerender } = render(<ArchetypeFeatsStep />);
    expect(updateDraft).not.toHaveBeenCalled();

    const tighter = withPoweredMartialFeatLimit(getGameRulesFallback(), 0);
    rulesState = { rules: tighter, isLoading: false, error: null };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: ['1'] });
    });
  });

  it('trims all picks when resolved cap transitions to zero', async () => {
    draft.archetypeFeatIds = ['1'];
    rulesState = { rules: getGameRulesFallback(), isLoading: true, error: null };
    const { rerender } = render(<ArchetypeFeatsStep />);
    expect(updateDraft).not.toHaveBeenCalled();

    const zeroCapRules = withPoweredMartialFeatLimit(getGameRulesFallback(), -1);
    expect(calculateMaxArchetypeFeats(1, 'powered-martial', zeroCapRules)).toBe(0);

    rulesState = { rules: zeroCapRules, isLoading: false, error: null };
    rerender(<ArchetypeFeatsStep />);
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith({ archetypeFeatIds: [] });
    });
  });
});

describe('ArchetypeFeatsStep L2 modal confirm capping', () => {
  beforeEach(async () => {
    updateDraft.mockClear();
    rulesState = { rules: getGameRulesFallback(), isLoading: true, error: null };
    const mod = await vi.importActual<typeof import('@/stores/guided-creator-store')>(
      '@/stores/guided-creator-store',
    );
    draft = {
      ...mod.useGuidedCreatorStore.getState().draft,
      ...resetDraft({ archetypeFeatIds: ['1', '2', '3'] }),
    };
  });

  it('caps feat ids via the step onConfirm after modal confirm', async () => {
    const user = userEvent.setup();
    const cap = calculateMaxArchetypeFeats(1, 'powered-martial', getGameRulesFallback());
    expect(cap).toBe(2);

    const { rerender } = render(<ArchetypeFeatsStep />);
    const seeMore = screen.getAllByRole('button', { name: stepCopy.seeMore });
    await user.click(seeMore[seeMore.length - 1]!);
    expect(screen.getByTestId('feats-l2-modal')).toBeTruthy();

    rulesState = { rules: getGameRulesFallback(), isLoading: false, error: null };
    rerender(<ArchetypeFeatsStep />);

    await user.click(screen.getByRole('button', { name: /Add Selected \(3\)/i }));

    await waitFor(() => {
      const confirmCap = updateDraft.mock.calls.find((call) => {
        const ids = call[0]?.archetypeFeatIds;
        return Array.isArray(ids) && ids.length === cap;
      });
      expect(confirmCap?.[0]?.archetypeFeatIds).toHaveLength(cap);
    });
  });
});
