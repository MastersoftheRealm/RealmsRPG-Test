import { describe, expect, it } from 'vitest';
import type { LibraryTechnique } from '@/types/library';
import type { CreatureData } from './creature-stat-block-types';
import { buildTechniquesForDisplay } from './creature-stat-block-display-data';

/** Saved snapshots with no parts and no library row for this viewer. */
const SAVED_TECHNIQUE_ROWS = [
  { creature: 'Goblin', name: 'Power Shot', energy: 6, weapon: 'Weapon', tp: 1 },
  { creature: 'Lvl. 1 Human Melee Martial', name: 'Clash', energy: 8, weapon: 'Weapon', tp: 3 },
  {
    creature: 'Lvl. 1 Human Melee Martial',
    name: 'saved snapshot',
    energy: 6,
    weapon: 'Weapon',
    tp: 1,
  },
  { creature: 'Rat', name: 'Expose', energy: 3, weapon: 'Unarmed', tp: 3 },
  { creature: 'Shambling Thorn', name: 'Block', energy: 4, weapon: 'Unarmed', tp: 3 },
  { creature: 'Shambling Thorn', name: 'Thorn Prick', energy: 4, weapon: 'Unarmed', tp: 2 },
] as const;

function creatureWithTechnique(
  creatureName: string,
  technique: {
    name: string;
    energy: number;
    weapon: string;
    tp: number;
    parts?: NonNullable<CreatureData['techniques']>[number]['parts'];
  },
): CreatureData {
  return {
    id: 'creature',
    name: creatureName,
    techniques: [
      {
        id: technique.name,
        name: technique.name,
        energy: technique.energy,
        weapon: technique.weapon,
        tp: technique.tp,
        action: 'Action',
        ...(technique.parts ? { parts: technique.parts } : {}),
      },
    ],
  };
}

describe('buildTechniquesForDisplay saved snapshots', () => {
  it('uses saved Energy, Attack, and Training Pts when the viewer has no matching technique and the row has no parts', () => {
    for (const row of SAVED_TECHNIQUE_ROWS) {
      const displayed = buildTechniquesForDisplay(
        creatureWithTechnique(row.creature, row),
        [],
        [],
        [],
      )[0];
      expect(displayed?.energyCost, row.name).toBe(row.energy);
      expect(displayed?.weaponName, row.name).toBe(row.weapon);
      expect(displayed?.tp, row.name).toBe(row.tp);
    }
  });

  it('still prices a technique that matches an official library row', () => {
    const official = {
      id: 'disarm',
      docId: 'disarm',
      name: 'Disarm',
      parts: [],
    } satisfies LibraryTechnique;
    const displayed = buildTechniquesForDisplay(
      creatureWithTechnique('Goblin', {
        name: 'Disarm',
        energy: 6,
        weapon: 'Weapon',
        tp: 1,
      }),
      [],
      [{ ...official, id: 'disarm' }],
      [],
    )[0];
    expect(displayed?.energyCost).toBe(0);
    expect(displayed?.weaponName).toBe('Unarmed');
    expect(displayed?.tp).toBe(0);
  });

  it('prices a snapshot that has parts instead of keeping a stale stored total', () => {
    const displayed = buildTechniquesForDisplay(
      creatureWithTechnique('Rat', {
        name: 'Expose',
        energy: 99,
        weapon: 'Weapon',
        tp: 9,
        parts: [{ id: 1, name: 'Missing Part', op_1_lvl: 1 }],
      }),
      [],
      [],
      [],
    )[0];
    expect(displayed?.energyCost).toBe(0);
    expect(displayed?.tp).toBe(0);
    expect(displayed?.weaponName).toBe('Unarmed');
  });
});
