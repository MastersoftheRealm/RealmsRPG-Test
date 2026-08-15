import { describe, expect, it } from 'vitest';
import {
  buildGuidedSkillSuggestions,
  guidedSuggestionsToBadgeMap,
} from './guided-skill-recommendations';
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

describe('buildGuidedSkillSuggestions', () => {
  const codexSkills: Skill[] = [
    skill({ id: '9', name: 'Athletics', ability: 'Strength' }),
    skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
    skill({ id: '99', name: 'Path Skill', ability: 'Strength' }),
    skill({
      id: '13',
      name: 'Craft',
      ability: 'Acuity, Agility, Charisma, Intelligence, Strength, Vitality',
    }),
    skill({ id: '30', name: 'Endurance', ability: 'Vitality' }),
    skill({ id: '31', name: 'Fortitude', ability: 'Vitality' }),
    skill({ id: '40', name: 'Acrobatics', ability: 'Agility' }),
    skill({ id: '41', name: 'Stealth', ability: 'Agility' }),
    skill({ id: '42', name: 'Perception', ability: 'Acuity' }),
    skill({ id: '43', name: 'Insight', ability: 'Acuity' }),
  ];

  const berserkerArchetype = {
    archetype_ability: 'strength' as const,
    secondary_ability: 'vitality' as const,
  };

  it('includes declined path skills with path badge', () => {
    const { suggestions } = buildGuidedSkillSuggestions({
      codexSkills,
      abilities: berserkerAbilities,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      archetype: berserkerArchetype,
      pathSkillIds: ['99'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: false,
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].skillId).toBe('99');
    expect(suggestions[0].tags).toEqual(['Berserker', 'Strength']);
    expect(suggestions[0].badges).toEqual([
      { label: 'Berserker', color: 'purple' },
      { label: 'Strength', color: 'blue' },
    ]);
  });

  it('tags ability-aligned skills with the governing ability', () => {
    const { suggestions } = buildGuidedSkillSuggestions({
      codexSkills,
      abilities: berserkerAbilities,
      declinedPathSkillIds: [],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      archetype: berserkerArchetype,
      pathSkillIds: [],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: true,
    });

    const ids = suggestions.map((s) => s.skillId);
    expect(ids).toContain('9');
    expect(ids).toContain('24');
    expect(ids).not.toContain('13');

    const athletics = suggestions.find((s) => s.skillId === '9');
    expect(athletics?.tags).toEqual(['Strength']);
    expect(athletics?.badges[0]).toEqual({ label: 'Strength', color: 'blue' });
  });

  it('expands through score tiers when primary skills are already taken', () => {
    const berserkerSkills = codexSkills.filter((s) => s.id !== '99');
    const { suggestions } = buildGuidedSkillSuggestions({
      codexSkills: berserkerSkills,
      abilities: berserkerAbilities,
      declinedPathSkillIds: [],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      archetype: berserkerArchetype,
      pathSkillIds: ['9', '24'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(['9', '24']),
      includeAbilityMatches: true,
    });

    const ids = suggestions.map((s) => s.skillId);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(ids).not.toContain('9');
    expect(ids).not.toContain('24');
    expect(ids).toContain('30');
    expect(ids).toContain('40');
  });

  it('lists declined path skills before ability-aligned picks', () => {
    const { suggestions } = buildGuidedSkillSuggestions({
      codexSkills,
      abilities: berserkerAbilities,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      archetype: berserkerArchetype,
      pathSkillIds: ['99'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: true,
    });

    expect(suggestions[0].skillId).toBe('99');
    expect(suggestions[0].kinds).toEqual(['path-declined']);
    expect(suggestions.some((s) => s.kinds.includes('ability-match'))).toBe(true);
  });

  it('maps suggestions to badge lookup for modal', () => {
    const { suggestions } = buildGuidedSkillSuggestions({
      codexSkills,
      abilities: berserkerAbilities,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      archetype: berserkerArchetype,
      pathSkillIds: ['99'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: false,
    });

    const map = guidedSuggestionsToBadgeMap(suggestions);
    expect(map['99']).toEqual([
      { label: 'Berserker', color: 'purple' },
      { label: 'Strength', color: 'blue' },
    ]);
  });
});
