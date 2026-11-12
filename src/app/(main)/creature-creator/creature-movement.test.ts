import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureMovementControlFeatId,
  movementAfterFlyLevel,
  movementAfterWalkLevel,
  movementAfterSwimLevel,
  movementDropdownFeats,
  movementSectionPointTotal,
  nextSpeedType,
  readWalkLevel,
} from './creature-movement';

const catalog = [
  {
    id: String(CREATURE_FEAT_IDS.SPEEDY),
    name: 'Speedy',
    description: '',
    points: 0.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.SPEEDY_II),
    name: 'Speedy II',
    description: '',
    points: 1,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.SPEEDY),
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.FLYING),
    name: 'Flying',
    description: '',
    points: 2,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.BOUNDING),
    name: 'Bounding',
    description: '',
    points: 1.5,
    feat_lvl: 1,
    mechanic: false,
    category: 'Movement',
  },
];

describe('creature movement section helpers', () => {
  it('treats Speedy and Flying as movement controls, not dropdown picks', () => {
    expect(isCreatureMovementControlFeatId(CREATURE_FEAT_IDS.SPEEDY)).toBe(true);
    expect(isCreatureMovementControlFeatId(CREATURE_FEAT_IDS.FLYING)).toBe(true);
    expect(movementDropdownFeats(catalog).map((f) => f.id)).toEqual([
      String(CREATURE_FEAT_IDS.BOUNDING),
    ]);
  });

  it('steps walk speed through Speedy family levels', () => {
    const stepped = movementAfterWalkLevel(initialState, 2, catalog);
    expect(readWalkLevel(stepped.movementTypes)).toBe(2);
    expect(stepped.movementTypes).toContain('Speedy II');
    expect(stepped.feats.map((f) => f.id)).toContain(String(CREATURE_FEAT_IDS.SPEEDY_II));
  });

  it('offers fly before swim for new speed types', () => {
    expect(nextSpeedType([])).toBe('fly');
    const withFly = movementAfterFlyLevel(initialState, 1, catalog);
    expect(nextSpeedType(withFly.movementTypes)).toBe('swim');
    const withSwim = movementAfterSwimLevel(withFly, 1);
    expect(withSwim.movementTypes).toContain('Swim Half');
    expect(nextSpeedType(withSwim.movementTypes)).toBeNull();
  });

  it('counts implied control feat costs from movementTypes for legacy creatures', () => {
    expect(
      movementSectionPointTotal({ ...initialState, movementTypes: ['Speedy'], feats: [] }, catalog),
    ).toBe(0.5);
  });
});
