import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import {
  isCreatureCreatorHiddenFeat,
  movementAfterBuiltInMode,
  movementToggleFeats,
  movementToggleLines,
  readBuiltInMovementLevel,
} from './creature-movement';
import { readBuiltInSenseLevel, sensesAfterBuiltInLevel } from './creature-senses';

const movementSection = readFileSync(
  new URL('./creature-creator-movement-section.tsx', import.meta.url),
  'utf8',
);
const sensesSection = readFileSync(
  new URL('./creature-creator-senses-section.tsx', import.meta.url),
  'utf8',
);

describe('creature creator movement and senses section UI', () => {
  it('does not use plus buttons to add movement or sense rows', () => {
    expect(movementSection).not.toMatch(/title=\{nextType === 'fly'/);
    expect(movementSection).not.toContain('Add flying speed');
    expect(movementSection).not.toContain('AddItemDropdown');
    expect(sensesSection).not.toContain('nextBuiltInSenseType');
    expect(sensesSection).not.toMatch(/>\s*\+\s*</);
  });

  it('lays out movement and sense toggles in a horizontal flex row', () => {
    expect(movementSection).toMatch(/flex flex-wrap items-center gap-x-4 gap-y-2/);
    expect(sensesSection).toMatch(/flex flex-wrap items-center gap-x-4 gap-y-2/);
    expect(movementSection).not.toMatch(/flex flex-col gap-2/);
    expect(sensesSection).not.toMatch(/flex flex-col gap-2/);
  });

  it('keeps active movement and sense steppers above the minimum tier', () => {
    expect(movementSection).toContain('ACTIVE_MODE_STEPPER_MIN');
    expect(sensesSection).toContain('ACTIVE_SENSE_STEPPER_MIN');
  });
});

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
  it('turns fly on at tier 1 and off at tier 0, and step-down stops at tier 1', () => {
    const on = movementAfterBuiltInMode(initialState, 'fly', 1, movementCatalog);
    expect(readBuiltInMovementLevel(on.movementTypes, 'fly')).toBe(1);
    const stepped = movementAfterBuiltInMode(on, 'fly', 0, movementCatalog);
    expect(readBuiltInMovementLevel(stepped.movementTypes, 'fly')).toBe(0);
    expect(movementToggleFeats(movementCatalog).map((feat) => feat.id)).toEqual([
      String(CREATURE_FEAT_IDS.HOVER),
    ]);
    const catalogById = new Map(movementCatalog.map((feat) => [String(feat.id), feat]));
    expect(
      isCreatureCreatorHiddenFeat(
        { id: CREATURE_FEAT_IDS.HOVER, name: 'Hover' },
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
];

describe('creature creator sense toggle behavior', () => {
  it('turns darkvision on at tier 1 and off at tier 0, and step-down stops at tier 1', () => {
    const on = sensesAfterBuiltInLevel(initialState, 'darkvision', 1, senseCatalog);
    expect(readBuiltInSenseLevel(on.senses, 'darkvision')).toBe(1);
    const off = sensesAfterBuiltInLevel(on, 'darkvision', 0, senseCatalog);
    expect(readBuiltInSenseLevel(off.senses, 'darkvision')).toBe(0);
  });
});
