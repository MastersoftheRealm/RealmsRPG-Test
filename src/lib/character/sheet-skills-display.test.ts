import { describe, expect, it } from 'vitest';
import {
  filterSheetSkillsDisplay,
  isCodexBaseSkill,
  mergeSheetSkillsWithCatalog,
} from './sheet-skills-display';

describe('isCodexBaseSkill', () => {
  it('treats null/undefined as base and 0 as sub-skill marker', () => {
    expect(isCodexBaseSkill({ id: '1', base_skill_id: undefined })).toBe(true);
    expect(isCodexBaseSkill({ id: '1', base_skill_id: null })).toBe(true);
    expect(isCodexBaseSkill({ id: '1', base_skill_id: 0 })).toBe(false);
    expect(isCodexBaseSkill({ id: '1', base_skill_id: 5 })).toBe(false);
  });
});

describe('mergeSheetSkillsWithCatalog', () => {
  const codex = [
    {
      id: '1',
      name: 'Athletics',
      ability: 'strength',
      description: 'Climb, swim, and jump.',
      base_skill_id: undefined,
    },
    { id: '2', name: 'Medicine', ability: 'intelligence', base_skill_id: undefined },
    {
      id: '3',
      name: 'Surgery',
      ability: 'intelligence',
      description: 'Operate under pressure.',
      base_skill_id: 2,
    },
  ];

  it('adds missing Codex base skills as catalog-only unproficient', () => {
    const merged = mergeSheetSkillsWithCatalog(
      [{ id: '1', name: 'Athletics', skill_val: 2, prof: true, ability: 'strength' }],
      codex,
    );
    const medicine = merged.find((s) => s.name === 'Medicine');
    expect(medicine).toMatchObject({
      id: '2',
      skill_val: 0,
      prof: false,
      catalogOnly: true,
    });
    expect(merged.some((s) => s.name === 'Surgery')).toBe(false);
  });

  it('keeps owned sub-skills under parents and does not invent unproficient catalog subs', () => {
    const merged = mergeSheetSkillsWithCatalog(
      [
        { id: '2', name: 'Medicine', skill_val: 1, prof: true },
        {
          id: '3',
          name: 'Surgery',
          skill_val: 1,
          prof: true,
          baseSkill: 'Medicine',
        },
        {
          id: '9',
          name: 'First Aid',
          skill_val: 0,
          prof: false,
          baseSkill: 'Medicine',
        },
      ],
      codex,
    );
    const names = merged.map((s) => s.name);
    expect(names.indexOf('Medicine')).toBeLessThan(names.indexOf('Surgery'));
    expect(names).toContain('First Aid');
    expect(merged.filter((s) => s.baseSkill).every((s) => s.catalogOnly !== true)).toBe(true);
  });

  it('relabels owned rows whose name is the Codex id and attaches descriptions', () => {
    const merged = mergeSheetSkillsWithCatalog(
      [{ id: '1', name: '1', skill_val: 0, prof: true }],
      codex,
    );
    const athletics = merged.filter((s) => s.name === 'Athletics');
    expect(athletics).toHaveLength(1);
    expect(athletics[0]).toMatchObject({
      id: '1',
      name: 'Athletics',
      description: 'Climb, swim, and jump.',
      prof: true,
      catalogOnly: false,
    });
  });

  it('dedupes an id-named species row against an already-owned skill of the same Codex name', () => {
    const merged = mergeSheetSkillsWithCatalog(
      [
        { id: 'legacy-ath', name: 'Athletics', skill_val: 2, prof: true },
        { id: '1', name: '1', skill_val: 0, prof: true },
      ],
      codex,
    );
    expect(merged.filter((s) => s.name === 'Athletics')).toHaveLength(1);
    expect(merged.find((s) => s.name === 'Athletics')?.skill_val).toBe(2);
  });

  it('resolves sub-skill parent ids to names and attaches Codex descriptions', () => {
    const merged = mergeSheetSkillsWithCatalog(
      [
        { id: '2', name: 'Medicine', skill_val: 1, prof: true },
        {
          id: '3',
          name: '3',
          skill_val: 1,
          prof: true,
          baseSkill: '2',
        },
      ],
      codex,
    );
    const surgery = merged.find((s) => s.id === '3');
    expect(surgery).toMatchObject({
      name: 'Surgery',
      baseSkill: 'Medicine',
      description: 'Operate under pressure.',
    });
  });
});

describe('filterSheetSkillsDisplay', () => {
  const rows = [
    { id: '1', name: 'Athletics', skill_val: 0, prof: false },
    { id: '2', name: 'Medicine', skill_val: 1, prof: true },
    { id: '3', name: 'Surgery', skill_val: 1, prof: true, baseSkill: 'Medicine' },
    { id: '4', name: 'First Aid', skill_val: 0, prof: false, baseSkill: 'Medicine' },
  ];

  it('filters proficient-only and can hide sub-skills', () => {
    expect(
      filterSheetSkillsDisplay(rows, { proficiencyFilter: 'proficient', showSubSkills: true }).map(
        (s) => s.name,
      ),
    ).toEqual(['Medicine', 'Surgery']);

    expect(
      filterSheetSkillsDisplay(rows, { proficiencyFilter: 'all', showSubSkills: false }).map(
        (s) => s.name,
      ),
    ).toEqual(['Athletics', 'Medicine']);
  });
});
