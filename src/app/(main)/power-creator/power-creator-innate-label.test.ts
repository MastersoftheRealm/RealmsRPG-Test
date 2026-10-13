import { describe, expect, it } from 'vitest';
import { innatePowerCreatorSummaryLabel } from './power-creator-innate-label';
import type { InnatePowerSnapshot } from '@/lib/game/innate-eligibility';

function snap(partial: Partial<InnatePowerSnapshot> & { id: string }): InnatePowerSnapshot {
  return {
    energy: 0,
    partIds: [],
    partNames: [],
    ...partial,
  };
}

describe('power creator innate summary label (86e3jzc58)', () => {
  it('reports non-qualifying quick-action powers without a character', () => {
    const label = innatePowerCreatorSummaryLabel(
      snap({ id: '1', energy: 24, actionType: 'quick' }),
    );
    expect(label).toBe('Does not qualify as innate');
  });

  it('stays informational for basic powers when threshold is unknown', () => {
    const label = innatePowerCreatorSummaryLabel(
      snap({
        id: '1',
        energy: 6,
        actionType: 'basic',
        duration: { type: 'instant', value: 0 },
      }),
    );
    expect(label).toBe('May qualify as innate');
  });

  it('judges energy against a character threshold when provided', () => {
    const high = innatePowerCreatorSummaryLabel(
      snap({
        id: '1',
        energy: 24,
        actionType: 'basic',
        duration: { type: 'instant', value: 0 },
      }),
      8,
    );
    expect(high).toBe('Does not qualify as innate');

    const ok = innatePowerCreatorSummaryLabel(
      snap({
        id: '1',
        energy: 6,
        actionType: 'basic',
        duration: { type: 'instant', value: 0 },
      }),
      8,
    );
    expect(ok).toBe('Qualifies as innate');
  });
});
