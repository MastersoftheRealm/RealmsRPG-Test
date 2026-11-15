import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureCreatorHiddenFeat,
  isCreatureMovementPlainToggleFeatId,
  movementAfterBuiltInMode,
  movementAfterJumpLevel,
  movementCheckboxFeats,
  movementModeDescription,
  movementModeStepperLabel,
  movementModesInCatalog,
  movementPlainToggleFeats,
  movementTravelSpeed,
  movementTravelSpeedCreatorDisplay,
  readBuiltInMovementLevel,
} from './creature-movement';
import { senseControlCreatorValue, sensesAfterBuiltInLevel } from './creature-senses';

const embeddedCatalog = [
  {
    id: String(CREATURE_FEAT_IDS.JUMP),
    name: 'Jump',
    description: 'This creature can long jump 3 spaces and high jump 2.',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.JUMP_II),
    name: 'Jump II',
    description: 'This creature can long jump 4 spaces and high jump 3.',
    points: 2,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.JUMP),
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.JUMP_III),
    name: 'Jump III',
    description: 'This creature can long jump 5 spaces and high jump 4.',
    points: 3,
    feat_lvl: 3,
    base_feat_id: String(CREATURE_FEAT_IDS.JUMP),
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.FLYING),
    name: 'Flying',
    description: 'Half-speed fly text.',
    points: 2,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.HOVER),
    name: 'Hover',
    description: 'Hover text.',
    points: -1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.TERRAIN_BOUND),
    name: 'Terrain Bound',
    description: 'Terrain bound text.',
    points: -2,
    feat_lvl: null,
    mechanic: false,
    category: null,
  },
  {
    id: String(CREATURE_FEAT_IDS.BOUNDING),
    name: 'Bounding',
    description: 'Bounding text.',
    points: 1.5,
    feat_lvl: 1,
    mechanic: false,
    category: 'Movement',
  },
];

describe('creature movement creator display', () => {
  it('rounds half movement speeds up for display while keeping the raw half-speed path', () => {
    expect(movementTravelSpeed(7, 1)).toBe(3.5);
    expect(movementTravelSpeedCreatorDisplay(7, 1)).toBe(4);
    expect(movementTravelSpeedCreatorDisplay(10, 2)).toBe(10);
  });

  it('keeps stepper text numeric and keeps descriptions for tooltips', () => {
    expect(movementModeStepperLabel(embeddedCatalog, CREATURE_FEAT_IDS.FLYING, 1)).toBe('1');
    expect(
      movementModeDescription(embeddedCatalog, CREATURE_FEAT_IDS.JUMP, 2, [
        CREATURE_FEAT_IDS.JUMP,
        CREATURE_FEAT_IDS.JUMP_II,
        CREATURE_FEAT_IDS.JUMP_III,
      ]),
    ).toBe('This creature can long jump 4 spaces and high jump 3.');
  });

  it('includes jump in embedded movement modes and plain toggles by named control ids', () => {
    expect(movementModesInCatalog(embeddedCatalog).map((mode) => mode.kind)).toContain('jump');
    const stepped = movementAfterJumpLevel(initialState, 2, embeddedCatalog);
    expect(readBuiltInMovementLevel(stepped.movementTypes, 'jump')).toBe(2);
    expect(isCreatureMovementPlainToggleFeatId(CREATURE_FEAT_IDS.HOVER)).toBe(true);
    expect(isCreatureMovementPlainToggleFeatId(CREATURE_FEAT_IDS.TERRAIN_BOUND)).toBe(true);
    expect(
      movementPlainToggleFeats(embeddedCatalog)
        .map((feat) => feat.id)
        .sort(),
    ).toEqual([String(CREATURE_FEAT_IDS.HOVER), String(CREATURE_FEAT_IDS.TERRAIN_BOUND)]);
    expect(movementCheckboxFeats(embeddedCatalog).map((feat) => feat.id)).toEqual([
      String(CREATURE_FEAT_IDS.BOUNDING),
    ]);
    const catalogById = new Map(embeddedCatalog.map((feat) => [String(feat.id), feat]));
    expect(
      isCreatureCreatorHiddenFeat(
        { id: CREATURE_FEAT_IDS.TERRAIN_BOUND },
        catalogById.get(String(CREATURE_FEAT_IDS.TERRAIN_BOUND)) ?? null,
      ),
    ).toBe(true);
    const toggled = movementAfterBuiltInMode(initialState, 'jump', 1, embeddedCatalog);
    expect(toggled.movementTypes).toContain('Jump');
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
];

describe('creature senses creator display', () => {
  it('shows sense level in the creator value, not the stored description', () => {
    const stepped = sensesAfterBuiltInLevel(initialState, 'darkvision', 1, senseCatalog);
    expect(senseControlCreatorValue(stepped.senses, 'darkvision')).toBe('1');
  });
});
