import { describe, expect, it } from 'vitest';
import {
  filterOfficialArmamentRows,
  filterOfficialPowerTechniqueRows,
} from './official-catalog-row-filter';

const identitySort = <T>(items: T[]) => items;

describe('filterOfficialPowerTechniqueRows', () => {
  const rows = [
    {
      id: '1',
      name: 'Fire Bolt',
      description: 'A bolt',
      category: 'Damage',
      weapon: 'Weapon',
    },
    {
      id: '2',
      name: 'Slash',
      description: 'Cut',
      category: 'Attack',
      weapon: 'Unarmed',
    },
  ];

  it('matches power rows on name, description, and category', () => {
    expect(
      filterOfficialPowerTechniqueRows(rows, 'fire', identitySort, 'power').map((r) => r.id),
    ).toEqual(['1']);
    expect(
      filterOfficialPowerTechniqueRows(rows, 'damage', identitySort, 'power').map((r) => r.id),
    ).toEqual(['1']);
  });

  it('matches technique rows on weapon as well as category', () => {
    expect(
      filterOfficialPowerTechniqueRows(rows, 'unarmed', identitySort, 'technique').map((r) => r.id),
    ).toEqual(['2']);
    expect(
      filterOfficialPowerTechniqueRows(rows, 'attack', identitySort, 'technique').map((r) => r.id),
    ).toEqual(['2']);
  });
});

describe('filterOfficialArmamentRows', () => {
  it('filters armament rows by name and description only', () => {
    const rows = [
      { id: 'a', name: 'Longsword', description: 'Steel blade' },
      { id: 'b', name: 'Buckler', description: 'Small shield' },
    ];
    expect(filterOfficialArmamentRows(rows, 'steel', identitySort).map((r) => r.id)).toEqual(['a']);
    expect(filterOfficialArmamentRows(rows, 'buckler', identitySort).map((r) => r.id)).toEqual([
      'b',
    ]);
  });
});
