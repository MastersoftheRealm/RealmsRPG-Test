import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { buildCreatureFeatsSummary } from './creature-creator-summaries';
import { initialState } from './creature-creator-constants';

describe('creature creator summaries', () => {
  it('omits movement control feats from the loadout feats summary', () => {
    const summary = buildCreatureFeatsSummary({
      ...initialState,
      feats: [
        { id: String(CREATURE_FEAT_IDS.SPEEDY), name: 'Speedy', points: 0.5, featSourceType: 'creature' },
        { id: String(CREATURE_FEAT_IDS.BOUNDING), name: 'Bounding', points: 1.5, featSourceType: 'creature' },
      ],
    });
    expect(summary).toBe('Bounding');
  });
});
