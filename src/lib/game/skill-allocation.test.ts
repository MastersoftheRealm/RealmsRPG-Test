import { describe, expect, it } from 'vitest';
import { calculateSubSkillBonusWithProficiency, subSkillAllocationAbility } from './formulas';
import {
  applySkillAllocationDecrease,
  BASE_SKILL_PAST_CAP_COST,
  calculateSimpleSkillPointsSpent,
  canIncreaseDefense,
  DEFAULT_SKILL_ALLOCATION_RULES,
  getSkillValueIncreaseCost,
  isSkillAllocationProficient,
  skillAllocationShownValue,
  SUB_SKILL_PAST_CAP_COST,
  UNPROFICIENT_SKILL_ALLOCATION,
  type SkillAllocationRules,
} from './skill-allocation';

describe('canIncreaseDefense (T4 / M5)', () => {
  it('allows a skill-point defense of 0 at level 3 even when the ability bonus is 3', () => {
    expect(canIncreaseDefense(0, 3, 3, 2)).toBe(true);
  });

  it('blocks when the skill-point portion already equals level', () => {
    expect(canIncreaseDefense(3, 3, 0, 10)).toBe(false);
  });
});

const codex = [
  { id: '10' },
  { id: '11', base_skill_id: 10 },
  { id: '12', base_skill_id: 10 },
  { id: '20' },
  { id: '21', base_skill_id: 20 },
] as const;

const meta = new Map<string, { isSubSkill: boolean }>([
  ['10', { isSubSkill: false }],
  ['11', { isSubSkill: true }],
  ['12', { isSubSkill: true }],
  ['20', { isSubSkill: false }],
  ['21', { isSubSkill: true }],
]);

function spent(
  allocations: Record<string, number>,
  rules?: SkillAllocationRules,
): number {
  return calculateSimpleSkillPointsSpent(allocations, new Set(), meta, undefined, rules);
}

function decrease(
  allocations: Record<string, number>,
  skillId: string,
  isSubSkill: boolean,
  isSpecies = false,
) {
  return applySkillAllocationDecrease(allocations, skillId, {
    isSubSkill,
    isSpecies,
    codexSkills: codex,
  });
}

describe('skill allocation refunds', () => {
  it('refunds a sub-skill from value 1 to unproficient', () => {
    const before = { '10': 0, '11': 1 };
    const after = decrease(before, '11', true);
    expect(after['11']).toBe(UNPROFICIENT_SKILL_ALLOCATION);
    expect(after['10']).toBe(0);
    expect(isSkillAllocationProficient(after['11'], true)).toBe(false);
    expect(skillAllocationShownValue(after['11'])).toBe(0);
    expect(spent(before) - spent(after)).toBe(DEFAULT_SKILL_ALLOCATION_RULES.gainProficiencyCost);
  });

  it('refunds a base skill proficiency point when it becomes unproficient', () => {
    const before = { '10': 0 };
    const after = decrease(before, '10', false);
    expect(after['10']).toBe(UNPROFICIENT_SKILL_ALLOCATION);
    expect(isSkillAllocationProficient(after['10'], false)).toBe(false);
    expect(skillAllocationShownValue(after['10'])).toBe(0);
    expect(spent(before) - spent(after)).toBe(DEFAULT_SKILL_ALLOCATION_RULES.gainProficiencyCost);
  });

  it('refunds sub-skill proficiency and value when a base skill becomes unproficient', () => {
    const before = { '10': 0, '11': 4, '12': 2, '20': 3, '21': 1 };
    const after = decrease(before, '10', false);
    expect(after['10']).toBe(UNPROFICIENT_SKILL_ALLOCATION);
    expect(after['11']).toBe(UNPROFICIENT_SKILL_ALLOCATION);
    expect(after['12']).toBe(UNPROFICIENT_SKILL_ALLOCATION);
    expect(after['20']).toBe(3);
    expect(after['21']).toBe(1);
    expect(isSkillAllocationProficient(after['11'], true)).toBe(false);
    const subSpend = spent({ '11': 4, '12': 2 });
    const baseSpend = spent({ '10': 0 });
    expect(spent(before) - spent(after)).toBe(subSpend + baseSpend);
  });

  it('does not clear sub-skills when a base skill only loses value', () => {
    const before = { '10': 2, '11': 1 };
    const after = decrease(before, '10', false);
    expect(after).toEqual({ '10': 1, '11': 1 });
    expect(spent(before) - spent(after)).toBe(getSkillValueIncreaseCost(1, false));
  });

  it('refunds 1 per step up through value 3', () => {
    const before = { '10': 3, '11': 3 };
    const baseAfter = decrease(before, '10', false);
    const subAfter = decrease(before, '11', true);
    expect(spent(before) - spent(baseAfter)).toBe(getSkillValueIncreaseCost(2, false));
    expect(spent(before) - spent(subAfter)).toBe(getSkillValueIncreaseCost(2, true));
    expect(getSkillValueIncreaseCost(2, false)).toBe(1);
    expect(getSkillValueIncreaseCost(2, true)).toBe(1);
  });

  it('refunds past-cap steps: 3 for a base skill and 2 for a sub-skill', () => {
    const before = { '10': 4, '11': 4 };
    const baseAfter = decrease(before, '10', false);
    const subAfter = decrease(before, '11', true);
    expect(baseAfter['10']).toBe(3);
    expect(subAfter['11']).toBe(3);
    expect(spent(before) - spent(baseAfter)).toBe(getSkillValueIncreaseCost(3, false));
    expect(spent(before) - spent(subAfter)).toBe(getSkillValueIncreaseCost(3, true));
    expect(getSkillValueIncreaseCost(3, false)).toBe(BASE_SKILL_PAST_CAP_COST);
    expect(getSkillValueIncreaseCost(3, true)).toBe(SUB_SKILL_PAST_CAP_COST);
  });

  it('uses the passed past-cap costs instead of fixed numbers', () => {
    const rules: SkillAllocationRules = {
      ...DEFAULT_SKILL_ALLOCATION_RULES,
      baseSkillPastCapCost: 9,
      subSkillPastCapCost: 7,
    };
    const before = { '10': 4, '11': 4 };
    const baseAfter = decrease(before, '10', false);
    const subAfter = decrease(before, '11', true);
    expect(spent(before, rules) - spent(baseAfter, rules)).toBe(
      getSkillValueIncreaseCost(3, false, rules),
    );
    expect(spent(before, rules) - spent(subAfter, rules)).toBe(
      getSkillValueIncreaseCost(3, true, rules),
    );
    expect(getSkillValueIncreaseCost(3, false, rules)).toBe(9);
    expect(getSkillValueIncreaseCost(3, true, rules)).toBe(7);
  });

  it('does not remove proficiency from a species skill', () => {
    const before = { '10': 0 };
    expect(decrease(before, '10', false, true)).toBe(before);
  });
});

describe('subSkillAllocationAbility', () => {
  const abilities = {
    strength: 1,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 4,
    charisma: 9,
  };

  it('shows one listed ability and uses that ability in the bonus', () => {
    const row = subSkillAllocationAbility('agility');
    expect(row.keys).toEqual(['agility']);
    expect(row.bonusAbilityKey).toBe('agility');
    expect(
      calculateSubSkillBonusWithProficiency(
        'agility',
        1,
        2,
        true,
        abilities,
        true,
        row.bonusAbilityKey,
      ),
    ).toBe(0 + 2 + 1);
  });

  it('keeps several Codex abilities as a set and does not pick one for the bonus key', () => {
    const row = subSkillAllocationAbility('strength, intelligence');
    expect(row.keys).toEqual(['strength', 'intelligence']);
    expect(row.bonusAbilityKey).toBeUndefined();
    expect(
      calculateSubSkillBonusWithProficiency(
        'strength, intelligence',
        1,
        2,
        true,
        abilities,
        true,
        row.bonusAbilityKey,
      ),
    ).toBe(4 + 2 + 1);
  });
});
