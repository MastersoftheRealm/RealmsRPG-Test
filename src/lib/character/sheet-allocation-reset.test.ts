import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import {
  applySheetAbilityAllocationReset,
  applySheetSkillAllocationReset,
  resetSheetSkillAllocationRows,
} from './sheet-allocation-reset';

describe('sheet allocation reset (86e3jvcge)', () => {
  it('zeros abilities and defense bonuses', () => {
    const prev = {
      id: 'c1',
      name: 'Test',
      level: 5,
      abilities: { ...DEFAULT_ABILITIES, strength: 3, vitality: 2 } as typeof DEFAULT_ABILITIES,
      defenseVals: { ...DEFAULT_DEFENSE_SKILLS, might: 2, reflex: 1 },
      currentHealth: 40,
      currentEnergy: 20,
    };
    const next = applySheetAbilityAllocationReset(prev);
    expect(next.abilities).toEqual(DEFAULT_ABILITIES);
    expect(next.defenseVals).toEqual(DEFAULT_DEFENSE_SKILLS);
  });

  it('keeps species skills proficient and clears other training', () => {
    const skills = [
      { id: '10', name: 'Athletics', prof: true, skill_val: 2, category: 'strength' },
      { id: '20', name: 'Stealth', prof: true, skill_val: 1, category: 'agility' },
      {
        id: '30',
        name: 'Tumbling',
        prof: true,
        skill_val: 1,
        baseSkill: 'Athletics',
        category: 'agility',
      },
    ];
    const next = resetSheetSkillAllocationRows(skills, ['10']);
    expect(next).toHaveLength(2);
    expect(next.find((s) => s.id === '10')).toMatchObject({ prof: true, skill_val: 0 });
    expect(next.find((s) => s.id === '20')).toMatchObject({ prof: false, skill_val: 0 });
    expect(next.some((s) => s.id === '30')).toBe(false);
  });

  it('applySheetSkillAllocationReset updates character.skills', () => {
    const prev = {
      id: 'c1',
      name: 'Test',
      level: 3,
      abilities: { ...DEFAULT_ABILITIES },
      skills: [{ id: '5', name: 'Lore', prof: true, skill_val: 1, category: 'intelligence' }],
    };
    const next = applySheetSkillAllocationReset(prev, []);
    expect(next.skills).toEqual([
      { id: '5', name: 'Lore', prof: false, skill_val: 0, category: 'intelligence' },
    ]);
  });
});
