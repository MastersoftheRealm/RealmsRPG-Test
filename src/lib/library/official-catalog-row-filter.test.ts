import { describe, expect, it } from 'vitest';
import { EMPTY_ARMAMENT_FILTERS } from '@/lib/library/armament-filters';
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
      sources: ['Core'],
      raw: { id: '1' },
    },
    {
      id: 'p-attack',
      name: 'Slash',
      description: 'Cut',
      category: 'Attack',
      categories: ['Attack'],
      weapon: 'Unarmed',
      sources: ['Crafting'],
      raw: { id: 'p-attack' },
    },
  ];

  it('matches power rows on name, description, and category', () => {
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: 'fire',
        sortItems: identitySort,
        kind: 'power',
      }).map((r) => r.id),
    ).toEqual(['1']);
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: 'damage',
        sortItems: identitySort,
        kind: 'power',
      }).map((r) => r.id),
    ).toEqual(['1']);
  });

  it('matches technique rows on weapon as well as category', () => {
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: 'unarmed',
        sortItems: identitySort,
        kind: 'technique',
      }).map((r) => r.id),
    ).toEqual(['p-attack']);
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: 'attack',
        sortItems: identitySort,
        kind: 'technique',
      }).map((r) => r.id),
    ).toEqual(['p-attack']);
  });

  it('filters by path recommendation ids when provided', () => {
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: '',
        sortItems: identitySort,
        kind: 'power',
        rowFilters: { pathRecommendedIds: new Set(['p-attack']) as ReadonlySet<string> },
      }).map((r) => r.id),
    ).toEqual(['p-attack']);
  });

  it('omits path filtering when rowFilters is null', () => {
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: '',
        sortItems: identitySort,
        kind: 'power',
        rowFilters: null,
      }).map((r) => r.id),
    ).toEqual(['1', 'p-attack']);
  });

  it('filters by rules sources after advanced filters (master order)', () => {
    const advanced = { ...EMPTY_POWER_TECHNIQUE_FILTERS, categories: ['Attack'] };
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: '',
        sortItems: identitySort,
        kind: 'power',
        rowFilters: { advanced, rulesSources: ['Core'] },
      }).map((r) => r.id),
    ).toEqual([]);
    expect(
      filterOfficialPowerTechniqueRows({
        rows,
        search: '',
        sortItems: identitySort,
        kind: 'power',
        rowFilters: { advanced, rulesSources: ['Crafting'] },
      }).map((r) => r.id),
    ).toEqual(['p-attack']);
  });
});

describe('filterOfficialArmamentRows', () => {
  it('filters armament rows by name and description only', () => {
    const rows = [
      { id: 'a', name: 'Longsword', description: 'Steel blade' },
      { id: 'b', name: 'Buckler', description: 'Small shield' },
    ];
    expect(
      filterOfficialArmamentRows({ rows, search: 'steel', sortItems: identitySort }).map(
        (r) => r.id,
      ),
    ).toEqual(['a']);
    expect(
      filterOfficialArmamentRows({ rows, search: 'buckler', sortItems: identitySort }).map(
        (r) => r.id,
      ),
    ).toEqual(['b']);
  });

  it('filters by armament advanced state', () => {
    const rows = [
      { id: 'a', name: 'Cheap', description: '', currency: 10 },
      { id: 'b', name: 'Costly', description: '', currency: 500 },
    ];
    const armament = { ...EMPTY_ARMAMENT_FILTERS, maxCurrency: 100 };
    expect(
      filterOfficialArmamentRows({
        rows,
        search: '',
        sortItems: identitySort,
        rowFilters: { armament },
      }).map((r) => r.id),
    ).toEqual(['a']);
  });

  it('filters by path recommendation ids when provided', () => {
    const rows = [
      { id: 'w1', name: 'Sword', description: '', raw: { id: 'w1' } },
      { id: 'w2', name: 'Spear', description: '', raw: { id: 'w2' } },
    ];
    expect(
      filterOfficialArmamentRows({
        rows,
        search: '',
        sortItems: identitySort,
        rowFilters: { pathRecommendedIds: new Set(['w2']) as ReadonlySet<string> },
      }).map((r) => r.id),
    ).toEqual(['w2']);
  });

  it('filters by rules sources after armament filters', () => {
    const rows = [
      { id: 'a', name: 'Longsword', description: 'Steel', sources: ['Core'], raw: { id: 'a' } },
      { id: 'b', name: 'Spear', description: 'Reach', sources: ['Crafting'], raw: { id: 'b' } },
    ];
    expect(
      filterOfficialArmamentRows({
        rows,
        search: '',
        sortItems: identitySort,
        rowFilters: { rulesSources: ['Core'] },
      }).map((r) => r.id),
    ).toEqual(['a']);
  });
});
