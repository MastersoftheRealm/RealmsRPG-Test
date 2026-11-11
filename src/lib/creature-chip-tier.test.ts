import { describe, expect, it } from 'vitest';
import {
  MOVEMENT_TO_FEAT_ID,
  SENSE_TO_FEAT_ID,
} from '@/app/(main)/creature-creator/creature-creator-constants';
import type { LeveledFeatLike } from '@/lib/leveled-feats';
import { replaceTieredCreatureChipValue } from './creature-chip-tier';

function creatureFeatMap(): Map<string, LeveledFeatLike> {
  const rows: LeveledFeatLike[] = [
    { id: '36', name: 'Speedy', feat_lvl: 1 },
    { id: '37', name: 'Speedy II', feat_lvl: 2, base_feat_id: '36' },
    { id: '38', name: 'Speedy III', feat_lvl: 3, base_feat_id: '36' },
    { id: '6', name: 'Flying', feat_lvl: 1 },
    { id: '7', name: 'Flying II', feat_lvl: 2, base_feat_id: '6' },
    { id: '10', name: 'Darkvision', feat_lvl: 1 },
    { id: '11', name: 'Darkvision II', feat_lvl: 2, base_feat_id: '10' },
    { id: '12', name: 'Darkvision III', feat_lvl: 3, base_feat_id: '10' },
    { id: '39', name: 'Slow', feat_lvl: 1 },
  ];
  return new Map(rows.map((r) => [String(r.id), r]));
}

describe('replaceTieredCreatureChipValue (86e3nwaru)', () => {
  const byId = creatureFeatMap();

  it('replaces a lower Speedy tier and leaves other movement', () => {
    expect(
      replaceTieredCreatureChipValue(
        ['Hover', 'Speedy', 'Fly Half'],
        'Speedy III',
        MOVEMENT_TO_FEAT_ID,
        byId,
      ),
    ).toEqual(['Hover', 'Fly Half', 'Speedy III']);
  });

  it('replaces a higher tier when a lower one is chosen', () => {
    expect(
      replaceTieredCreatureChipValue(['Darkvision III'], 'Darkvision', SENSE_TO_FEAT_ID, byId),
    ).toEqual(['Darkvision']);
  });

  it('replaces Flying half with full and does not duplicate Slow', () => {
    expect(
      replaceTieredCreatureChipValue(['Fly Half', 'Slow'], 'Fly', MOVEMENT_TO_FEAT_ID, byId),
    ).toEqual(['Slow', 'Fly']);
    expect(replaceTieredCreatureChipValue(['Slow'], 'Slow', MOVEMENT_TO_FEAT_ID, byId)).toEqual([
      'Slow',
    ]);
  });
});
