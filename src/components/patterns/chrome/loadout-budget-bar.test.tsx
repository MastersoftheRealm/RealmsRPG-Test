// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LibraryPower } from '@/types/library';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import { computeGuidedTrainingPointsBudgetSpent } from '@/lib/guided-creator/build-character';
import { LoadoutBudgetBar } from './loadout-budget-bar';

describe('LoadoutBudgetBar Training Points over pool', () => {
  it('shows −2 and the warn-only alert when pool spent is 27 of 25', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    const officialPowers: LibraryPower[] = [
      {
        id: 'elemental-burst',
        docId: 'elemental-burst',
        name: 'Elemental Burst',
        parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 0 }],
      },
      {
        id: 'mend-beast',
        docId: 'mend-beast',
        name: 'Mend Beast',
        parts: [{ id: Number(range.id), name: range.name, op_1_lvl: 1 }],
      },
    ];
    const tpCostOf = (id: string) => (id === 'elemental-burst' ? 14 : id === 'mend-beast' ? 13 : 0);
    const draft = {
      powerIds: ['elemental-burst', 'mend-beast'],
      innatePowerIds: [],
      techniqueIds: [],
      loadoutWeapons: [],
      loadoutArmor: [],
      equipment: [],
    } as unknown as GuidedDraft;
    const poolSpent = computeGuidedTrainingPointsBudgetSpent(
      draft,
      { officialPowers, powerPartsDb: [range] },
      0,
      tpCostOf,
    );
    expect(poolSpent).toBe(27);

    render(<LoadoutBudgetBar tpTotal={25} tpSpent={poolSpent} />);

    expect(screen.getByText('-2')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(
      'You are 2 Training Points over budget. You can still continue.',
    );
  });
});
