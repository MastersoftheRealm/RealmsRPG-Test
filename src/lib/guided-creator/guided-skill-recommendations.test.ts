import { describe, expect, it } from 'vitest';
import { buildGuidedSkillSuggestions, guidedSuggestionsToBadgeMap } from './guided-skill-recommendations';
import type { Skill } from '@/hooks';

function skill(partial: Partial<Skill> & { id: string; name: string }): Skill {
  return partial as Skill;
}

describe('buildGuidedSkillSuggestions', () => {
  const codexSkills: Skill[] = [
    skill({ id: '9', name: 'Athletics', ability: 'Strength' }),
    skill({ id: '24', name: 'Intimidate', ability: 'Charisma, Strength, Vitality' }),
    skill({ id: '99', name: 'Path Skill', ability: 'Strength' }),
    skill({ id: '13', name: 'Craft', ability: 'Acuity, Agility, Charisma, Intelligence, Strength, Vitality' }),
  ];

  it('includes declined path skills with path badge', () => {
    const suggestions = buildGuidedSkillSuggestions({
      codexSkills,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      powAbil: null,
      martAbil: 'strength',
      pathSkillIds: ['99'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: false,
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].skillId).toBe('99');
    expect(suggestions[0].tags).toContain('Berserker');
    expect(suggestions[0].badges[0]).toEqual({ label: 'Berserker', color: 'purple' });
  });

  it('includes ability-aligned skills when enabled', () => {
    const suggestions = buildGuidedSkillSuggestions({
      codexSkills,
      declinedPathSkillIds: [],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      powAbil: null,
      martAbil: 'strength',
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
    expect(athletics?.tags).toEqual(['Recommended']);
    expect(athletics?.badges[0]).toEqual({ label: 'Recommended', color: 'green' });
  });

  it('lists declined path skills before ability-aligned picks', () => {
    const suggestions = buildGuidedSkillSuggestions({
      codexSkills,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      powAbil: null,
      martAbil: 'strength',
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
    const suggestions = buildGuidedSkillSuggestions({
      codexSkills,
      declinedPathSkillIds: ['99'],
      pathSourceLabel: 'Berserker',
      archetypeType: 'martial',
      powAbil: null,
      martAbil: 'strength',
      pathSkillIds: ['99'],
      speciesSkillIds: [],
      selectedSkillIds: new Set(),
      includeAbilityMatches: false,
    });

    const map = guidedSuggestionsToBadgeMap(suggestions);
    expect(map['99']).toEqual([{ label: 'Berserker', color: 'purple' }]);
  });
});
