import { describe, expect, it } from 'vitest';
import {
  filterEligibleEquipment,
  isCommonRarity,
  meetsAbilityRequirement,
  rankWeaponCandidates,
  resolveArmorStepMode,
  shouldSkipArmorPhase,
  validateWeaponHandSelection,
  type EligibleEquipmentRow,
  type EquipmentEligibilityContext,
} from '@/lib/guided-creator/equipment-eligibility';
import { PROPERTY_IDS } from '@/lib/id-constants';

const baseAbilities = {
  strength: 3,
  vitality: 2,
  agility: 1,
  acuity: 1,
  intelligence: 0,
  charisma: 0,
};

function ctx(overrides: Partial<EquipmentEligibilityContext> = {}): EquipmentEligibilityContext {
  return {
    phase: 'weapon',
    abilities: baseAbilities,
    martAbil: 'strength',
    powAbil: null,
    archetypeType: 'martial',
    pathRecommendedIds: new Set(['a']),
    selectedTpSpent: 0,
    tpLimit: 30,
    ...overrides,
  };
}

describe('equipment-eligibility', () => {
  it('resolves armor step defaults for power', () => {
    expect(resolveArmorStepMode(undefined, 'power')).toBe('none');
    expect(shouldSkipArmorPhase('none')).toBe(true);
  });

  it('filters common items meeting ability requirements and armament max', () => {
    const rows: EligibleEquipmentRow[] = [
      {
        id: 'a',
        name: 'Battleaxe',
        type: 'weapon',
        rarity: 'Common',
        trainingPoints: 4,
        properties: [],
      },
      {
        id: 'b',
        name: 'Rare sword',
        type: 'weapon',
        rarity: 'Rare',
        trainingPoints: 2,
        properties: [],
      },
      {
        id: 'c',
        name: 'Heavy plate',
        type: 'weapon',
        rarity: 'Common',
        trainingPoints: 20,
        properties: [],
      },
    ];
    const eligible = filterEligibleEquipment(rows, ctx());
    expect(eligible.map((r) => r.id)).toEqual(['a']);
  });

  it('blocks gear over 50c', () => {
    const rows: EligibleEquipmentRow[] = [
      { id: '1', name: 'Rope', type: 'equipment', rarity: 'common', gold_cost: 10 },
      { id: '2', name: 'Expensive kit', type: 'equipment', rarity: 'common', gold_cost: 75 },
    ];
    const eligible = filterEligibleEquipment(rows, ctx({ phase: 'gear', remainingCurrency: 200 }));
    expect(eligible.map((r) => r.id)).toEqual(['1']);
  });

  it('ranks path recommendations and archetype ability matches first', () => {
    const rows: EligibleEquipmentRow[] = [
      {
        id: 'z',
        name: 'Longbow',
        type: 'weapon',
        properties: [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }],
      },
      {
        id: 'a',
        name: 'Battleaxe',
        type: 'weapon',
        properties: [],
      },
    ];
    const ranked = rankWeaponCandidates(rows, {
      pathRecommendedIds: new Set(['a']),
      martAbil: 'strength',
      powAbil: null,
    });
    expect(ranked[0]?.id).toBe('a');
  });

  it('rejects two-handed weapon with shield', () => {
    const result = validateWeaponHandSelection([
      { id: '1', name: 'Greataxe', type: 'weapon', properties: [{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed' }] },
      { id: '2', name: 'Shield', type: 'shield', properties: [] },
    ]);
    expect(result.valid).toBe(false);
  });

  it('checks ability requirements', () => {
    expect(meetsAbilityRequirement({ name: 'Strength', level: 3 }, baseAbilities)).toBe(true);
    expect(meetsAbilityRequirement({ name: 'Strength', level: 4 }, baseAbilities)).toBe(false);
    expect(isCommonRarity('COMMON')).toBe(true);
  });
});
