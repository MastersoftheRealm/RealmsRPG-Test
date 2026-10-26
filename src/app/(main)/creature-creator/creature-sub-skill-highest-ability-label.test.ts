import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREATURE_SUB_SKILL_HIGHEST_ABILITY_LABEL } from './creature-sub-skill-highest-ability-label';
import {
  calculateSubSkillBonusWithProficiency,
  subSkillAllocationAbility,
} from '@/lib/game/formulas';

const allocationPage = readFileSync(
  new URL('../../../components/patterns/list/skills-allocation-page.tsx', import.meta.url),
  'utf8',
);
const skillRow = readFileSync(
  new URL('../../../components/patterns/list/skill-row.tsx', import.meta.url),
  'utf8',
);

describe('creature sub-skill highest ability label (86e3jx4dq)', () => {
  it('uses the exact user-facing copy', () => {
    expect(CREATURE_SUB_SKILL_HIGHEST_ABILITY_LABEL).toBe('Uses the highest listed ability');
  });

  it('gates the hint to creature creator multi-ability sub-skills only', () => {
    expect(allocationPage).toContain(
      "entityType === 'creature' && isSubSkill && linkedKeys.length > 1",
    );
    expect(allocationPage).toContain('CREATURE_SUB_SKILL_HIGHEST_ABILITY_LABEL');
    expect(allocationPage).toContain('multiAbilitySubSkillHint');
  });

  it('renders the hint as a row suffix on SkillRow', () => {
    expect(skillRow).toContain('multiAbilitySubSkillHint');
    expect(skillRow).toContain('{multiAbilitySubSkillHint}');
  });

  it('still uses the highest listed ability for multi-ability sub-skill bonus (unchanged)', () => {
    const abilities = {
      strength: 1,
      vitality: 0,
      agility: 0,
      acuity: 0,
      intelligence: 4,
      charisma: 9,
    };
    const row = subSkillAllocationAbility('strength, intelligence');
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
