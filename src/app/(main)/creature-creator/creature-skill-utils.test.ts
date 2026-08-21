import { describe, expect, it } from 'vitest';
import { rawRecordToCreatureState } from './creature-skill-utils';

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
});
