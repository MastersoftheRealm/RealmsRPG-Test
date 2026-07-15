import { describe, expect, it } from 'vitest';
import {
  GUIDED_CURATED_MIN_SUGGESTIONS,
  curateGuidedSkillIds,
  formatGuidedAbilityKeysLabel,
  formatGuidedSkillAbilityTag,
  getGuidedAbilityRecommendationTiers,
  getGuidedCuratedSkillIds,
  isTooBroadSkillAbility,
  resolveGuidedArchetypeAbilities,
  skillMatchesArchetypeAbility,
} from './curated-skills';
import type { Skill } from '@/hooks';
import type { Abilities } from '@/types';

function skill(partial: Partial<Skill> & { id: string; name: string }): Skill {
  return partial as Skill;
}

const berserkerAbilities: Abilities = {
  strength: 3,
  vitality: 2,
  agility: 1,
  acuity: 1,
  intelligence: 0,
  charisma: 0,
};

describe('isTooBroadSkillAbility', () => {
  it('flags all-six-ability skills', () => {
    expect(
      isTooBroadSkillAbility('Acuity, Agility, Charisma, Intelligence, Strength, Vitality')
    ).toBe(true);
  });

  it('allows up to three governing abilities', () => {
    expect(isTooBroadSkillAbility('Charisma, Strength, Vitality')).toBe(false);
    expect(isTooBroadSkillAbility('Strength')).toBe(false);
  });
});

describe('skillMatchesArchetypeAbility', () => {
  const strength = new Set(['strength']);

  it('matches single-ability strength skills', () => {
    expect(
      skillMatchesArchetypeAbility(skill({ id: '9', name: 'Athletics', ability: 'Strength' }), strength)
    ).toBe(true);
  });

  it('matches multi-ability skills that include strength', () => {
    expect(
      skillMatchesArchetypeAbility(
        skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
        strength
      )
    ).toBe(true);
  });

  it('rejects all-ability skills even when strength is listed', () => {
    expect(
      skillMatchesArchetypeAbility(
        skill({ id: '13', name: 'Craft', ability: 'Acuity, Agility, Charisma, Intelligence, Strength, Vitality' }),
        strength
      )
    ).toBe(false);
  });

  it('rejects skills without the archetype ability', () => {
    expect(
      skillMatchesArchetypeAbility(skill({ id: '7', name: 'Arcana', ability: 'Intelligence' }), strength)
    ).toBe(false);
  });
});

describe('resolveGuidedArchetypeAbilities', () => {
  it('uses archetype_ability and secondary_ability for martial paths', () => {
    expect(
      resolveGuidedArchetypeAbilities('martial', {
        archetype: {
          archetype_ability: 'strength',
          secondary_ability: 'vitality',
        },
      })
    ).toEqual({ primary: 'strength', secondary: 'vitality' });
  });
});

describe('getGuidedAbilityRecommendationTiers', () => {
  it('puts archetype ability first, then score tiers with ties grouped', () => {
    expect(getGuidedAbilityRecommendationTiers(berserkerAbilities, 'strength')).toEqual([
      ['strength'],
      ['vitality'],
      ['agility', 'acuity'],
      ['intelligence', 'charisma'],
    ]);
  });
});

describe('curateGuidedSkillIds', () => {
  const codexSkills: Skill[] = [
    skill({ id: '9', name: 'Athletics', ability: 'Strength' }),
    skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
    skill({ id: '13', name: 'Craft', ability: 'Acuity, Agility, Charisma, Intelligence, Strength, Vitality' }),
    skill({ id: '7', name: 'Arcana', ability: 'Intelligence' }),
    skill({ id: '3', name: 'Act', ability: 'Charisma', base_skill_id: 14 }),
    skill({ id: '30', name: 'Endurance', ability: 'Vitality' }),
    skill({ id: '31', name: 'Fortitude', ability: 'Vitality' }),
    skill({ id: '40', name: 'Acrobatics', ability: 'Agility' }),
    skill({ id: '41', name: 'Stealth', ability: 'Agility' }),
    skill({ id: '42', name: 'Perception', ability: 'Acuity' }),
    skill({ id: '43', name: 'Insight', ability: 'Acuity' }),
  ];

  it('returns strength-aligned base skills not already selected', () => {
    const { skillIds } = curateGuidedSkillIds({
      codexSkills,
      abilities: berserkerAbilities,
      archetypeType: 'martial',
      primaryAbility: 'strength',
      pathSkillIds: [],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
    });

    expect(skillIds).toContain('9');
    expect(skillIds).toContain('24');
    expect(skillIds).not.toContain('13');
    expect(skillIds).not.toContain('7');
    expect(skillIds).not.toContain('3');
  });

  it('expands through ability-score tiers when primary pool is exhausted', () => {
    const { skillIds, abilityKeysUsed } = curateGuidedSkillIds({
      codexSkills,
      abilities: berserkerAbilities,
      archetypeType: 'martial',
      primaryAbility: 'strength',
      pathSkillIds: ['9', '24'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(['9', '24']),
      minSuggestions: GUIDED_CURATED_MIN_SUGGESTIONS,
    });

    expect(skillIds.length).toBeGreaterThanOrEqual(GUIDED_CURATED_MIN_SUGGESTIONS);
    expect(skillIds).not.toContain('9');
    expect(skillIds).not.toContain('24');
    expect(skillIds).toContain('30');
    expect(skillIds).toContain('40');
    expect(abilityKeysUsed).toEqual(expect.arrayContaining(['vitality', 'agility', 'acuity']));
  });

  it('includes tied score tiers together when topping up', () => {
    const { skillIds } = curateGuidedSkillIds({
      codexSkills,
      abilities: berserkerAbilities,
      archetypeType: 'martial',
      primaryAbility: 'strength',
      pathSkillIds: ['9', '24', '30', '31'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(['9', '24', '30', '31']),
      minSuggestions: 4,
    });

    expect(skillIds.length).toBeGreaterThanOrEqual(4);
    expect(skillIds).toContain('40');
    expect(skillIds).toContain('42');
  });

  it('getGuidedCuratedSkillIds returns skill ids only', () => {
    const ids = getGuidedCuratedSkillIds({
      codexSkills,
      abilities: berserkerAbilities,
      archetypeType: 'martial',
      primaryAbility: 'strength',
      pathSkillIds: [],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
    });

    expect(ids).toContain('9');
  });
});

describe('formatGuidedSkillAbilityTag', () => {
  it('returns the highest-scoring governing ability label', () => {
    const label = formatGuidedSkillAbilityTag(
      skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
      berserkerAbilities
    );
    expect(label).toBe('Strength');
  });
});

describe('formatGuidedAbilityKeysLabel', () => {
  it('formats one or two abilities', () => {
    expect(formatGuidedAbilityKeysLabel(new Set(['strength']))).toBe('Strength');
    expect(formatGuidedAbilityKeysLabel(['strength', 'vitality'])).toBe('Strength or Vitality');
  });
});
