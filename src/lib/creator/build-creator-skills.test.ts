import { describe, expect, it } from 'vitest';
import { buildCreatorSkillSaveRows } from './build-creator-skills';
import { cleanForSave } from '@/lib/data-enrichment';
import type { Character } from '@/types';

const codexSkills = [
  { id: '10', name: 'Athletics', category: 'physical', ability: 'Strength' },
  { id: '20', name: 'Persuasion', category: 'social', ability: 'Presence' },
  { id: '30', name: 'Lockpick', category: 'mental', ability: 'Agility,Intelligence', base_skill_id: '10' },
];

describe('buildCreatorSkillSaveRows', () => {
  it('preserves proficient-only skill_val 0 through cleanForSave', () => {
    const rows = buildCreatorSkillSaveRows(
      { '10': 0, '20': 2 },
      { codexSkills }
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '10', name: 'Athletics', skill_val: 0, prof: true }),
        expect.objectContaining({ id: '20', name: 'Persuasion', skill_val: 2, prof: true }),
      ])
    );

    const lean = cleanForSave({ skills: rows } as Character);
    const saved = lean.skills as Array<{ id?: string; skill_val?: number; prof?: boolean }>;
    expect(saved.find((s) => s.id === '10')).toMatchObject({ skill_val: 0, prof: true });
    expect(saved.find((s) => s.id === '20')).toMatchObject({ skill_val: 2, prof: true });
  });

  it('includes species skill ids even when missing from the points record', () => {
    const rows = buildCreatorSkillSaveRows(
      { '20': 1 },
      { speciesSkillIds: ['10', '0'], codexSkills }
    );
    expect(rows.map((r) => r.id).sort()).toEqual(['10', '20']);
    expect(rows.find((r) => r.id === '10')).toMatchObject({
      skill_val: 0,
      prof: true,
      name: 'Athletics',
    });
  });

  it('resolves ability and optional baseSkill name', () => {
    const rows = buildCreatorSkillSaveRows(
      { '30': 0 },
      { codexSkills, includeBaseSkillName: true }
    );
    expect(rows[0]).toMatchObject({
      id: '30',
      name: 'Lockpick',
      ability: 'agility',
      baseSkill: 'Athletics',
      skill_val: 0,
      prof: true,
    });
  });

  it('ignores negative allocations', () => {
    const rows = buildCreatorSkillSaveRows({ '10': -1, '20': 0 }, { codexSkills });
    expect(rows.map((r) => r.id)).toEqual(['20']);
  });
});
