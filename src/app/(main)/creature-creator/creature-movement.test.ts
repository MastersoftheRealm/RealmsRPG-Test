import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureMovementControlFeatId,
  isCreatureMovementEffectFeat,
  movementAfterBurrowLevel,
  movementAfterFlyLevel,
  movementAfterWalkLevel,
  movementAfterSwimLevel,
  movementDropdownFeats,
  movementSectionPointTotal,
  movementToggleLines,
  movementTravelLines,
  nextSpeedType,
  readWalkLevel,
  walkLevelCap,
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

  it('uses a further Speedy family level as the speed step, not a listed feat', () => {
    const withFourth = [
      ...catalog,
      {
        id: '166',
        name: 'Speedy',
        description: 'This creature’s Speed is increased by 4.',
        points: 2,
        feat_lvl: 4,
        base_feat_id: String(CREATURE_FEAT_IDS.SPEEDY),
        mechanic: false,
        category: 'Movement',
      },
    ];
    expect(walkLevelCap(withFourth).up).toBe(4);
    const stepped = movementAfterWalkLevel(initialState, 4, withFourth);
    expect(readWalkLevel(stepped.movementTypes)).toBe(4);
    expect(stepped.movementTypes).toContain('walk:+4');
    expect(stepped.movementTypes).not.toContain('Speedy');
    expect(stepped.feats.map((feat) => feat.id)).toEqual(['166']);
    expect(stepped.feats[0]?.boundControl).toBe(true);
    expect(isCreatureMovementEffectFeat(stepped.feats[0]!)).toBe(true);
    expect(movementDropdownFeats(withFourth).map((feat) => feat.id)).toEqual([
      String(CREATURE_FEAT_IDS.BOUNDING),
    ]);
    expect(
      movementSectionPointTotal(
        { ...initialState, movementTypes: stepped.movementTypes, feats: stepped.feats },
        withFourth,
      ),
    ).toBe(2);
  });

  it('publishes fly, swim, and burrow speeds, and toggle feats by their saved text', () => {
    const withFly = movementAfterFlyLevel(initialState, 2, catalog);
    const withBurrow = movementAfterBurrowLevel(withFly, 2, catalog);
    const types = movementAfterSwimLevel(withBurrow, 1).movementTypes;
    expect(movementTravelLines(types, 10)).toEqual([
      { label: 'Flying Speed', value: '10' },
      { label: 'Swimming Speed', value: '5' },
      { label: 'Burrow Speed', value: '10' },
    ]);
    expect(
      movementToggleLines([
        { id: CREATURE_FEAT_IDS.HOVER, name: 'Hover', description: 'Stays aloft.' },
        { id: CREATURE_FEAT_IDS.BOUNDING, name: 'Bounding' },
      ]),
    ).toEqual([{ id: String(CREATURE_FEAT_IDS.HOVER), name: 'Hover', description: 'Stays aloft.' }]);
  });
});
