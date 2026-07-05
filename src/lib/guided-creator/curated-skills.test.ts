import { describe, expect, it } from 'vitest';
import {
  formatGuidedAbilityKeysLabel,
  getGuidedCuratedSkillIds,
  isTooBroadSkillAbility,
  skillMatchesArchetypeAbility,
} from './curated-skills';
import type { Skill } from '@/hooks';

function skill(partial: Partial<Skill> & { id: string; name: string }): Skill {
  return partial as Skill;
}

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

describe('getGuidedCuratedSkillIds', () => {
  const codexSkills: Skill[] = [
    skill({ id: '9', name: 'Athletics', ability: 'Strength' }),
    skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
    skill({ id: '13', name: 'Craft', ability: 'Acuity, Agility, Charisma, Intelligence, Strength, Vitality' }),
    skill({ id: '7', name: 'Arcana', ability: 'Intelligence' }),
    skill({ id: '3', name: 'Act', ability: 'Charisma', base_skill_id: '14' }),
  ];

  it('returns strength-aligned base skills not already selected', () => {
    const ids = getGuidedCuratedSkillIds({
      codexSkills,
      archetypeType: 'martial',
      powAbil: null,
      martAbil: 'strength',
      pathSkillIds: [],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
    });

    expect(ids).toContain('9');
    expect(ids).toContain('24');
    expect(ids).not.toContain('13');
    expect(ids).not.toContain('7');
    expect(ids).not.toContain('3');
  });
});

describe('formatGuidedAbilityKeysLabel', () => {
  it('formats one or two abilities', () => {
    expect(formatGuidedAbilityKeysLabel(new Set(['strength']))).toBe('Strength');
    expect(formatGuidedAbilityKeysLabel(new Set(['strength', 'vitality']))).toBe('Strength or Vitality');
  });
});
