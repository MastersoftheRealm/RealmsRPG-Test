import { describe, expect, it } from 'vitest';
import type { CharacterProficiency } from '@/types';
import { calculateProficiencyTP, syncProficienciesToLoadout } from './proficiencies';

function row(
  id: string,
  name: string,
  baseTP: number,
  extra: Partial<CharacterProficiency> = {},
): CharacterProficiency {
  return {
    id,
    kind: 'item_property',
    name,
    baseTP,
    op1Level: 0,
    op1TP: 0,
    ...extra,
  };
}

describe('syncProficienciesToLoadout', () => {
  it('replaces a stale higher cost with the current loadout cost', () => {
    const stale = row('owned', 'Weapon Agility Requirement', 1, { op1Level: 4, op1TP: 0.5 });
    const current = row('required', 'Weapon Agility Requirement', 1);
    expect(calculateProficiencyTP(stale)).toBe(3);
    expect(calculateProficiencyTP(current)).toBe(1);

    const synced = syncProficienciesToLoadout([stale], [current]);
    expect(synced).toHaveLength(1);
    expect(calculateProficiencyTP(synced[0]!)).toBe(1);
    expect(synced[0]?.id).toBe('required');
  });

  it('keeps custom proficiencies and drops ones the loadout no longer needs', () => {
    const custom: CharacterProficiency = {
      id: 'custom',
      kind: 'custom',
      custom: true,
      name: 'Homebrew',
      baseTP: 2,
    };
    const unused = row('old-range', 'Power Range', 1, { kind: 'power_part' });
    const current = row('required', 'Weapon Agility Requirement', 1);

    const synced = syncProficienciesToLoadout([unused, custom], [current]);
    expect(synced.map((prof) => prof.name).sort()).toEqual([
      'Homebrew',
      'Weapon Agility Requirement',
    ]);
    expect(synced.find((prof) => prof.custom)?.baseTP).toBe(2);
  });
});
