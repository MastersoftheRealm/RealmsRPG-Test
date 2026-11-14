import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureCreatorHiddenFeat,
  movementAfterBuiltInMode,
  movementModesInCatalog,
  movementToggleFeats,
  movementToggleLines,
  readBuiltInMovementLevel,
} from './creature-movement';
import { readBuiltInSenseLevel, sensesAfterBuiltInLevel } from './creature-senses';

const movementCatalog = [
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
    description: '',
    points: 0.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.BURROW),
    name: 'Burrow',
    description: '',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.HOVER),
    name: 'Hover',
    description: 'Stays aloft.',
    points: 1,
    feat_lvl: 1,
    mechanic: false,
    category: 'Movement',
  },
];

describe('creature creator movement toggle behavior', () => {
  it('lists every built-in movement mode present in the catalog for toggle rows', () => {
    expect(movementModesInCatalog(movementCatalog).map((mode) => mode.kind)).toEqual([
      'fly',
      'swim',
      'burrow',
    ]);
  });

  it('turns fly on at tier 1, off at tier 0, and keeps tier 1 when toggled on', () => {
    const on = movementAfterBuiltInMode(initialState, 'fly', 1, movementCatalog);
    expect(readBuiltInMovementLevel(on.movementTypes, 'fly')).toBe(1);
    const stepped = movementAfterBuiltInMode(on, 'fly', 0, movementCatalog);
    expect(readBuiltInMovementLevel(stepped.movementTypes, 'fly')).toBe(0);
    const toggledOn = movementAfterBuiltInMode(stepped, 'fly', 1, movementCatalog);
    expect(readBuiltInMovementLevel(toggledOn.movementTypes, 'fly')).toBe(1);
    expect(movementToggleFeats(movementCatalog).map((feat) => feat.id)).toEqual([
      String(CREATURE_FEAT_IDS.HOVER),
    ]);
    const catalogById = new Map(movementCatalog.map((feat) => [String(feat.id), feat]));
    expect(
      isCreatureCreatorHiddenFeat(
        { id: CREATURE_FEAT_IDS.HOVER },
        catalogById.get(String(CREATURE_FEAT_IDS.HOVER)) ?? null,
      ),
    ).toBe(true);
    expect(
      movementToggleLines(
        [{ id: CREATURE_FEAT_IDS.HOVER, name: 'Hover', description: 'Stays aloft.' }],
        catalogById,
      ),
    ).toEqual([
      { id: String(CREATURE_FEAT_IDS.HOVER), name: 'Hover', description: 'Stays aloft.' },
    ]);
  });
});

const senseCatalog = [
  {
    id: String(CREATURE_FEAT_IDS.DARKVISION),
    name: 'Darkvision',
    description: 'Sees in darkness out to 6 spaces.',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.BLINDSENSE),
    name: 'Blindsense',
    description: 'Perceives within 6 spaces.',
    points: 1.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
];

describe('creature creator sense toggle behavior', () => {
  it('turns darkvision on at tier 1 and off at tier 0', () => {
    const on = sensesAfterBuiltInLevel(initialState, 'darkvision', 1, senseCatalog);
    expect(readBuiltInSenseLevel(on.senses, 'darkvision')).toBe(1);
    const off = sensesAfterBuiltInLevel(on, 'darkvision', 0, senseCatalog);
    expect(readBuiltInSenseLevel(off.senses, 'darkvision')).toBe(0);
    const blindsenseOn = sensesAfterBuiltInLevel(off, 'blindsense', 1, senseCatalog);
    expect(readBuiltInSenseLevel(blindsenseOn.senses, 'blindsense')).toBe(1);
  });
});
