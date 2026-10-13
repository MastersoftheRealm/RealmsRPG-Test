import { describe, expect, it } from 'vitest';
import {
  applyAddedBaseSkills,
  applyAddedSubSkills,
  buildCharacterSkillsForSubModal,
  buildExistingSkillIdSet,
  buildExistingSkillNames,
  removeAllocatedSkill,
} from '@/lib/game/skill-allocation-add';
import type { Skill } from '@/hooks';

const baseSkill = { id: '10', name: 'Athletics' } as Skill;
const subSkill = { id: '11', name: 'Climbing', base_skill_id: 10 } as Skill;

describe('skill-allocation-add', () => {
  it('buildExistingSkillIdSet merges species and allocations', () => {
    const ids = buildExistingSkillIdSet(new Set(['1', '2']), { '3': 0, '4': 1 });
    expect(ids.has('1')).toBe(true);
    expect(ids.has('3')).toBe(true);
    expect(ids.has('4')).toBe(true);
  });

  it('applyAddedBaseSkills adds proficient base skills at value 0', () => {
    const next = applyAddedBaseSkills({}, [baseSkill]);
    expect(next['10']).toBe(0);
  });

  it('applyAddedSubSkills auto-adds base and sub at value 1', () => {
    const next = applyAddedSubSkills({}, [{ ...subSkill, autoAddBaseSkill: baseSkill }]);
    expect(next['10']).toBe(0);
    expect(next['11']).toBe(1);
  });

  it('buildCharacterSkillsForSubModal lists base skills on character', () => {
    const rows = buildCharacterSkillsForSubModal([baseSkill, subSkill], new Set(['10']), {
      '10': 0,
    });
    expect(rows).toEqual([{ id: '10', name: 'Athletics', prof: true }]);
  });

  it('removing a base skill also removes its sub-skill (86e3jx4dp)', () => {
    const craft = { id: '20', name: 'Craft' } as Skill;
    const smith = { id: '21', name: 'Smith', base_skill_id: 20 } as Skill;
    const other = { id: '22', name: 'Lore', base_skill_id: 10 } as Skill;
    const next = removeAllocatedSkill({ '10': 0, '11': 1, '20': 2, '21': 1, '22': 1 }, '20', [
      baseSkill,
      subSkill,
      craft,
      smith,
      other,
    ]);
    expect(next['20']).toBeUndefined();
    expect(next['21']).toBeUndefined();
    expect(next['10']).toBe(0);
    expect(next['11']).toBe(1);
    expect(next['22']).toBe(1);
  });

  it('buildExistingSkillNames resolves names from ids', () => {
    const names = buildExistingSkillNames([baseSkill], new Set(['10']));
    expect(names).toEqual(['Athletics']);
  });
});
