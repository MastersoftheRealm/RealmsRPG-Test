import { describe, expect, it } from 'vitest';
import { EMPTY_POWER_TECHNIQUE_FILTERS } from '@/lib/library/power-technique-filters';
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
      categories: ['Damage'],
      weapon: 'Weapon',
      raw: { sources: ['Core'], pathIds: ['p-damage'] },
    },
    {
      id: 'p-attack',
      name: 'Slash',
      description: 'Cut',
      category: 'Attack',
      categories: ['Attack'],
      weapon: 'Unarmed',
      raw: { sources: ['Crafting'], pathIds: ['p-attack'] },
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
    ).toEqual(['p-attack']);
    expect(
      filterOfficialPowerTechniqueRows(rows, 'attack', identitySort, 'technique').map((r) => r.id),
    ).toEqual(['p-attack']);
  });

  it('filters by path recommendation ids when provided', () => {
    expect(
      filterOfficialPowerTechniqueRows(
        rows,
        '',
        identitySort,
        'power',
        undefined,
        null,
        new Set(['p-attack']) as ReadonlySet<string>,
      ).map((r) => r.id),
    ).toEqual(['p-attack']);
  });

  it('filters by rules sources after advanced filters (master order)', () => {
    const advanced = { ...EMPTY_POWER_TECHNIQUE_FILTERS, categories: ['Attack'] };
    expect(
      filterOfficialPowerTechniqueRows(rows, '', identitySort, 'power', advanced, null, null, [
        'Core',
      ]).map((r) => r.id),
    ).toEqual([]);
    expect(
      filterOfficialPowerTechniqueRows(rows, '', identitySort, 'power', advanced, null, null, [
        'Crafting',
      ]).map((r) => r.id),
    ).toEqual(['p-attack']);
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

  it('filters by rules sources after armament filters', () => {
    const rows = [
      { id: 'a', name: 'Longsword', description: 'Steel', raw: { sources: ['Core'] } },
      { id: 'b', name: 'Spear', description: 'Reach', raw: { sources: ['Crafting'] } },
    ];
    expect(
      filterOfficialArmamentRows(rows, '', identitySort, undefined, null, null, ['Core']).map(
        (r) => r.id,
      ),
    ).toEqual(['a']);
  });
});
