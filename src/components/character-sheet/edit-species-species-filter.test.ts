import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { filterSheetSpecies } from './edit-species-species-filter';

const step = readFileSync(new URL('./edit-species-species-step.tsx', import.meta.url), 'utf8');

const species = [
  { id: 'pub', name: 'Alpha' },
  { id: 'mine', name: 'Alpha Two' },
  { id: 'other', name: 'Beta' },
];
const mine = new Set(['mine']);

describe('sheet species picker filters (86e3jvjhj)', () => {
  it('uses the mixed-picker source split', () => {
    expect(filterSheetSpecies(species, mine, 'public', '').map((s) => s.id)).toEqual([
      'pub',
      'other',
    ]);
    expect(filterSheetSpecies(species, mine, 'my', '').map((s) => s.id)).toEqual(['mine']);
    expect(filterSheetSpecies(species, mine, 'all', '')).toHaveLength(3);
  });

  it('narrows the current source by name', () => {
    expect(filterSheetSpecies(species, mine, 'all', 'alpha').map((s) => s.id)).toEqual([
      'pub',
      'mine',
    ]);
    expect(filterSheetSpecies(species, mine, 'public', 'two')).toEqual([]);
  });

  it('puts search and the mixed-picker source labels on the sheet species step', () => {
    expect(step).toContain('filterSheetSpecies');
    expect(step).toContain('aria-label="Search species"');
    expect(step).toContain("label: 'Public species'");
    expect(step).toContain("label: 'My species'");
    expect(step).toContain("label: 'All sources'");
  });
});
