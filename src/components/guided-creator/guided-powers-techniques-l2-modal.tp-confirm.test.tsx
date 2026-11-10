// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GuidedPowersTechniquesL2Modal } from './guided-powers-techniques-l2-modal';

vi.mock('@/hooks', () => ({
  usePathListFilter: () => ({
    selectedPathIds: [],
    setSelectedPathIds: vi.fn(),
    pathIndex: { options: [] },
    pathRecommendedIds: [],
    pathFilterActive: false,
  }),
}));

vi.mock('@/components/patterns', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/patterns')>();
  return {
    ...mod,
    UnifiedSelectionModal: ({
      confirmDisabled,
    }: {
      confirmDisabled?: (selected: unknown[]) => boolean;
    }) => {
      const disabled = confirmDisabled?.([]) ?? false;
      return (
        <button type="button" disabled={disabled} aria-label="confirm">
          Add Selected
        </button>
      );
    },
  };
});

const baseProps = {
  isOpen: true,
  kind: 'powers' as const,
  mode: 'regular' as const,
  items: [],
  powerPartsDb: [],
  techniquePartsDb: [],
  initialSelectedIds: [],
  loadoutTpSpent: 0,
  tpLimit: 25,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

describe('GuidedPowersTechniquesL2Modal Training Points confirm', () => {
  it('keeps Confirm enabled when display spend is over the pool but deduped spend is not', () => {
    render(
      <GuidedPowersTechniquesL2Modal
        {...baseProps}
        resolveTotalTpSpent={() => 27}
        resolveConfirmTpSpent={() => 2}
      />,
    );
    expect(screen.getByRole('button', { name: 'confirm' })).toHaveProperty('disabled', false);
  });
});
