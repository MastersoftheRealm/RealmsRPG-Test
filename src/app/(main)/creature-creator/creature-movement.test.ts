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
  movementControlFeatIdsFromNames,
  movementSectionPointTotal,
  movementToggleLines,
  movementTravelLines,
  nextSpeedType,
  readSwimLevel,
  readWalkLevel,
  swimLevelCap,
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
    id: String(CREATURE_FEAT_IDS.FLYING_II),
    name: 'Fly',
    description: 'Fly at full regular speed.',
    points: 3,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.FLYING),
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.SWIMMING),
    name: 'Swimming',
    description: 'Swim at half regular speed.',
    points: 0.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.SWIMMING_II),
    name: 'Swimming II',
    description: 'Swim at full regular speed.',
    points: 1,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.SWIMMING),
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
    const withSwim = movementAfterSwimLevel(withFly, 1, catalog);
    expect(withSwim.movementTypes).toContain('Swim Half');
    expect(withSwim.feats.map((f) => f.id)).toContain(String(CREATURE_FEAT_IDS.SWIMMING));
    expect(nextSpeedType(withSwim.movementTypes)).toBeNull();
  });

  it('counts implied control feat costs from movementTypes for legacy creatures', () => {
    expect(
      movementSectionPointTotal({ ...initialState, movementTypes: ['Speedy'], feats: [] }, catalog),
    ).toBe(0.5);
    expect(movementControlFeatIdsFromNames(['Speedy'], catalog)).toEqual([
      String(CREATURE_FEAT_IDS.SPEEDY),
    ]);
  });

  it('clamps the walk stepper at the highest Slow level in the catalog', () => {
    const withFourthSlow = [
      ...catalog,
      {
        id: String(CREATURE_FEAT_IDS.SLOW),
        name: 'Slow',
        description: '',
        points: -0.5,
        feat_lvl: 1,
        mechanic: true,
        category: 'Movement',
      },
      {
        id: String(CREATURE_FEAT_IDS.SLOW_II),
        name: 'Slow',
        description: '',
        points: -1,
        feat_lvl: 2,
        base_feat_id: String(CREATURE_FEAT_IDS.SLOW),
        mechanic: true,
        category: 'Movement',
      },
      {
        id: String(CREATURE_FEAT_IDS.SLOW_III),
        name: 'Slow',
        description: '',
        points: -1.5,
        feat_lvl: 3,
        base_feat_id: String(CREATURE_FEAT_IDS.SLOW),
        mechanic: true,
        category: 'Movement',
      },
      {
        id: '167',
        name: 'Slow',
        description: 'This creature’s Speed is decreased by 4.',
        points: -2.5,
        feat_lvl: 4,
        base_feat_id: String(CREATURE_FEAT_IDS.SLOW),
        mechanic: true,
        category: 'Movement',
      },
    ];
    expect(walkLevelCap(withFourthSlow).down).toBe(4);
    const capped = movementAfterWalkLevel(initialState, -99, withFourthSlow);
    expect(readWalkLevel(capped.movementTypes)).toBe(-4);
    expect(capped.movementTypes).toContain('walk:-4');
    expect(capped.feats.map((feat) => feat.id)).toEqual(['167']);
    const slowIv = withFourthSlow.find((feat) => feat.id === '167');
    expect(isCreatureMovementEffectFeat(capped.feats[0]!, slowIv)).toBe(true);
    expect(movementControlFeatIdsFromNames(['walk:-4'], withFourthSlow)).toEqual(['167']);
    expect(movementAfterWalkLevel(initialState, -5, withFourthSlow).feats.map((feat) => feat.id)).toEqual(
      ['167'],
    );
  });

  it('clamps the walk stepper at the highest Speedy level in the catalog', () => {
    const withFourth = [
      ...catalog,
      {
        id: '166',
        name: 'Speedy',
        description: 'This creature’s Speed is increased by 4.',
        points: 2.5,
        feat_lvl: 4,
        base_feat_id: String(CREATURE_FEAT_IDS.SPEEDY),
        mechanic: false,
        category: 'Movement',
      },
    ];
    expect(walkLevelCap(withFourth).up).toBe(4);
    const capped = movementAfterWalkLevel(initialState, 99, withFourth);
    expect(readWalkLevel(capped.movementTypes)).toBe(4);
    expect(movementAfterWalkLevel(initialState, 5, withFourth).feats.map((feat) => feat.id)).toEqual([
      '166',
    ]);
    expect(
      movementControlFeatIdsFromNames(['walk:+4'], withFourth),
    ).toEqual(['166']);
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

  it('clamps swimming at the highest catalog level and charges the matching row', () => {
    expect(swimLevelCap(catalog)).toBe(2);
    const stepped = movementAfterSwimLevel(initialState, 2, catalog);
    expect(readSwimLevel(stepped.movementTypes)).toBe(2);
    expect(stepped.feats.map((feat) => feat.id)).toEqual([String(CREATURE_FEAT_IDS.SWIMMING_II)]);
    const capped = movementAfterSwimLevel(stepped, 99, catalog);
    expect(readSwimLevel(capped.movementTypes)).toBe(2);
    expect(capped.feats.map((feat) => feat.id)).toEqual([String(CREATURE_FEAT_IDS.SWIMMING_II)]);
    expect(movementControlFeatIdsFromNames(capped.movementTypes, catalog)).toEqual([
      String(CREATURE_FEAT_IDS.SWIMMING_II),
    ]);
    expect(
      movementSectionPointTotal(
        { ...initialState, movementTypes: capped.movementTypes, feats: capped.feats },
        catalog,
      ),
    ).toBe(1);
  });

  it('does not bind a swim level above the last catalog row', () => {
    const oneTier = catalog.filter((feat) => String(feat.id) !== String(CREATURE_FEAT_IDS.SWIMMING_II));
    expect(swimLevelCap(oneTier)).toBe(1);
    const atCap = movementAfterSwimLevel(initialState, 2, oneTier);
    expect(readSwimLevel(atCap.movementTypes)).toBe(1);
    expect(atCap.feats.map((feat) => feat.id)).toEqual([String(CREATURE_FEAT_IDS.SWIMMING)]);
  });

  it('publishes fly, swim, and burrow speeds, and toggle feats by their saved text', () => {
    const withFly = movementAfterFlyLevel(initialState, 2, catalog);
    const withBurrow = movementAfterBurrowLevel(withFly, 2, catalog);
    const types = movementAfterSwimLevel(withBurrow, 1, catalog).movementTypes;
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
