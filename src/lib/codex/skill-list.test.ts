import { describe, expect, it } from 'vitest';
import type { Skill } from '@/hooks';
import type { CharacterSkillRow } from '@/types';
import {
  buildSkillIdToName,
  collectCharacterSkillKeys,
  filterSkills,
  findSkillByIdOrName,
  type SkillListFilters,
} from './skill-list';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import {
  buildPathRecommendationIndex,
  pathRecommendedEntityIds,
} from '@/lib/game/path-recommendation-index';

function skill(partial: Pick<Skill, 'id' | 'name'> & Partial<Skill>): Skill {
  return {
    description: '',
    ability: '',
    ...partial,
  };
}

const athletics = skill({ id: '10', name: 'Athletics', ability: 'strength' });
const climbing = skill({
  id: '11',
  name: 'Climbing',
  ability: 'strength',
  base_skill_id: 10,
});
const persuasion = skill({ id: '20', name: 'Persuasion', ability: 'charisma' });
const lying = skill({
  id: '21',
  name: 'Lying',
  ability: 'charisma',
  base_skill_id: 20,
});
const anyBaseSub = skill({
  id: '99',
  name: 'Wildcard',
  ability: 'intelligence',
  base_skill_id: 0,
});

const allSkills = [athletics, climbing, persuasion, lying, anyBaseSub];

const emptyFilters: SkillListFilters = {
  search: '',
  abilities: [],
  baseSkill: '',
  subSkillMode: 'all',
};

describe('collectCharacterSkillKeys', () => {
  it('collects id and name from lean skill rows', () => {
    const rows: CharacterSkillRow[] = [{ id: '10', name: 'Athletics', skill_val: 0, prof: true }];
    const keys = collectCharacterSkillKeys(rows);
    expect(keys.has('10')).toBe(true);
    expect(keys.has('athletics')).toBe(true);
  });

  it('collects record keys', () => {
    const keys = collectCharacterSkillKeys({ '20': 2, Persuasion: 1 });
    expect(keys.has('20')).toBe(true);
    expect(keys.has('persuasion')).toBe(true);
  });

  it('returns empty for missing skills', () => {
    expect(collectCharacterSkillKeys(undefined).size).toBe(0);
  });
});

describe('findSkillByIdOrName', () => {
  it('matches by id or by name and ignores case', () => {
    expect(findSkillByIdOrName(allSkills, '10')?.name).toBe('Athletics');
    expect(findSkillByIdOrName(allSkills, 'athletics')?.id).toBe('10');
    expect(findSkillByIdOrName(allSkills, 'missing')).toBeUndefined();
  });
});

describe('filterSkills character scope', () => {
  const skillIdToName = buildSkillIdToName(allSkills);
  const knownIds = collectCharacterSkillKeys([
    { id: '10', name: 'Athletics', skill_val: 1, prof: true },
  ]);

  it('ignores known/base-owned filters when no character is selected', () => {
    const filtered = filterSkills(
      allSkills,
      { ...emptyFilters, knownMode: 'known', baseSkillOwnedOnly: true },
      skillIdToName,
      null,
    );
    expect(filtered).toHaveLength(5);
  });

  it('keeps ability/search filters when the character has no skills', () => {
    const filtered = filterSkills(
      allSkills,
      { ...emptyFilters, abilities: ['charisma'] },
      skillIdToName,
      new Set(),
    );
    expect(filtered.map((s) => s.name)).toEqual(['Persuasion', 'Lying']);
  });

  it('filters to known skills by id or name', () => {
    const filtered = filterSkills(
      allSkills,
      { ...emptyFilters, knownMode: 'known' },
      skillIdToName,
      knownIds,
    );
    expect(filtered.map((s) => s.name)).toEqual(['Athletics']);
  });

  it('filters to not-known skills', () => {
    const filtered = filterSkills(
      allSkills,
      { ...emptyFilters, knownMode: 'not-known' },
      skillIdToName,
      knownIds,
    );
    expect(filtered.map((s) => s.name)).toEqual(['Climbing', 'Persuasion', 'Lying', 'Wildcard']);
  });

  it('keeps sub-skills whose named base the character has (not any-base id 0)', () => {
    const filtered = filterSkills(
      allSkills,
      { ...emptyFilters, baseSkillOwnedOnly: true },
      skillIdToName,
      knownIds,
    );
    expect(filtered.map((s) => s.name)).toEqual(['Climbing']);
  });
});

describe('filterSkills — Archetype Path filter (TASK-752)', () => {
  const skillIdToName = buildSkillIdToName(allSkills);
  const index = buildPathRecommendationIndex({
    paths: [
      {
        id: 'p-monk',
        name: 'Monk',
        type: 'martial',
        path_data: parseArchetypePathData({ level1: { skills: ['10'] } }),
      },
      {
        id: 'p-bard',
        name: 'Bard',
        type: 'power',
        path_data: parseArchetypePathData({ level1: { skills: ['20'] } }),
      },
    ],
    entities: allSkills,
    kind: 'skills',
  });

  it('keeps only skills the selected paths recommend and unions them', () => {
    const monk = filterSkills(
      allSkills,
      emptyFilters,
      skillIdToName,
      null,
      pathRecommendedEntityIds(index, ['p-monk']),
    );
    expect(monk.map((s) => s.id)).toEqual(['10']);
    const both = filterSkills(
      allSkills,
      emptyFilters,
      skillIdToName,
      null,
      pathRecommendedEntityIds(index, ['p-monk', 'p-bard']),
    );
    expect(both.map((s) => s.id).sort()).toEqual(['10', '20']);
  });

  it('composes with ability filters and leaves the list untouched with no path filter', () => {
    const capped = filterSkills(
      allSkills,
      { ...emptyFilters, abilities: ['strength'] },
      skillIdToName,
      null,
      pathRecommendedEntityIds(index, ['p-monk', 'p-bard']),
    );
    expect(capped.map((s) => s.id)).toEqual(['10']);
    expect(filterSkills(allSkills, emptyFilters, skillIdToName, null, null)).toHaveLength(5);
  });
});
