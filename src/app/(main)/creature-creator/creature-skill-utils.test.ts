import { describe, expect, it } from 'vitest';
import type { Skill } from '@/hooks';
import { creatureSkillsToAllocations, rawRecordToCreatureState } from './creature-skill-utils';

describe('rawRecordToCreatureState inventory (TASK-812)', () => {
  it('migrates a mixed armaments bag into kind buckets', () => {
    const state = rawRecordToCreatureState({
      name: 'Goblin',
      armaments: [
        { id: 'w1', name: 'Spear', type: 'weapon', tp: 1, currency: 10, rarity: 'Common' },
        { id: 'e1', name: 'Torch', type: 'equipment', tp: 0, currency: 1, rarity: 'Common' },
      ],
    });
    expect(state.weapons.map((i) => i.id)).toEqual(['w1']);
    expect(state.equipment.map((i) => i.id)).toEqual(['e1']);
    expect(state.armor).toEqual([]);
    expect(state.shields).toEqual([]);
    expect(state.enableArmaments).toBe(true);
  });

  it('keeps kind buckets and ignores leftover armaments', () => {
    const state = rawRecordToCreatureState({
      name: 'Knight',
      weapons: [{ id: 'w2', name: 'Sword', type: 'weapon', tp: 2, currency: 20, rarity: 'Common' }],
      armor: [],
      shields: [],
      equipment: [],
      armaments: [
        { id: 'stale', name: 'Stale', type: 'weapon', tp: 1, currency: 1, rarity: 'Common' },
      ],
    });
    expect(state.weapons.map((i) => i.id)).toEqual(['w2']);
  });

  it('drops a sub-skill whose base skill is gone (86e3jx4dp)', () => {
    const codex = [
      { id: '20', name: 'Craft' },
      { id: '21', name: 'Smith', base_skill_id: 20 },
      { id: '10', name: 'Athletics' },
    ] as Skill[];
    const allocations = creatureSkillsToAllocations(
      [
        { id: '10', name: 'Athletics', value: 1, proficient: true },
        {
          id: '21',
          name: 'Smith',
          value: 1,
          proficient: true,
          isSubSkill: true,
          baseSkillId: '20',
        },
      ],
      codex,
    );
    expect(allocations['10']).toBe(1);
    expect(allocations['21']).toBeUndefined();
  });
});
