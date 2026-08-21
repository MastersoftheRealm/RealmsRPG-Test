import { describe, expect, it } from 'vitest';
import type { Archetype, Character } from '@/types';
import {
  canSaveForgeAbilities,
  groupPathsByCategory,
  inferArchetypeCategoryFromCharacter,
  listPlayerVisiblePaths,
  pathCategoryGroupLabel,
  redistributeProficiency,
} from './archetype-edit';

describe('redistributeProficiency / infer category', () => {
  it('splits powered-martial with martial getting the odd point (path-switch default, M8)', () => {
    // Default even split when changing path type — not the every-5th-level +1 pick.
    expect(redistributeProficiency(5, 'powered-martial')).toEqual({
      mart_prof: 3,
      pow_prof: 2,
    });
    expect(redistributeProficiency(4, 'power')).toEqual({ mart_prof: 0, pow_prof: 4 });
    expect(redistributeProficiency(4, 'martial')).toEqual({ mart_prof: 4, pow_prof: 0 });
  });

  it('infers category from proficiency when type missing', () => {
    expect(
      inferArchetypeCategoryFromCharacter({
        pow_prof: 3,
        mart_prof: 0,
      } as Character),
    ).toBe('power');
    expect(
      inferArchetypeCategoryFromCharacter({
        pow_prof: 2,
        mart_prof: 2,
      } as Character),
    ).toBe('powered-martial');
  });
});

describe('listPlayerVisiblePaths / groupPathsByCategory', () => {
  const paths = [
    {
      id: 'p1',
      name: 'Wizard',
      type: 'power',
      path_data: { level1: { feats: ['feat-a'] } },
    },
    {
      id: 'p2',
      name: 'Fighter',
      type: 'martial',
      path_data: { level1: { techniques: ['tech-a'] } },
    },
    {
      id: 'hidden',
      name: 'Hidden',
      type: 'power',
      path_data: { level1: { notes: 'admin only' } },
    },
  ] as Archetype[];

  it('filters player-visible and can exclude current', () => {
    const listed = listPlayerVisiblePaths(paths, { excludeId: 'p1' });
    expect(listed.map((p) => p.id)).toEqual(['p2']);
  });

  it('groups by category labels', () => {
    const listed = listPlayerVisiblePaths(paths);
    const grouped = groupPathsByCategory(listed);
    expect(grouped.power.map((p) => p.id)).toEqual(['p1']);
    expect(grouped.martial.map((p) => p.id)).toEqual(['p2']);
    expect(pathCategoryGroupLabel('powered-martial')).toBe('Powered-Martial Paths');
  });
});

describe('canSaveForgeAbilities', () => {
  it('requires distinct abilities for powered-martial', () => {
    expect(
      canSaveForgeAbilities({
        selectedType: 'powered-martial',
        selectedPowerAbility: 'strength',
        selectedMartialAbility: 'strength',
      }),
    ).toBe(false);
    expect(
      canSaveForgeAbilities({
        selectedType: 'powered-martial',
        selectedPowerAbility: 'strength',
        selectedMartialAbility: 'agility',
      }),
    ).toBe(true);
  });
});
