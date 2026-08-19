import { describe, expect, it } from 'vitest';
import type { Character, CharacterAncestry } from '@/types';
import { migrateSkillsAfterSpeciesChange } from './species-skill-migration';

const oldAncestry: CharacterAncestry = { id: 'old-sp', name: 'Oldfolk' };
const newAncestry: CharacterAncestry = { id: 'new-sp', name: 'Newfolk' };

const allSpecies = [
  { id: 'old-sp', name: 'Oldfolk', skills: ['skill-old'] },
  { id: 'new-sp', name: 'Newfolk', skills: ['skill-ath'] },
];

const allSkills = [
  { id: 'skill-old', name: 'Survival', ability: 'wisdom' },
  { id: 'skill-ath', name: 'Athletics', ability: 'strength' },
];

function characterWithSkills(
  skills: Array<{
    id: string;
    name?: string | undefined;
    skill_val?: number | undefined;
    prof?: boolean | undefined;
  }>,
  ancestry: CharacterAncestry = oldAncestry,
): Character {
  return {
    id: 'c1',
    name: 'Hero',
    level: 1,
    abilities: {
      strength: 2,
      vitality: 0,
      agility: 0,
      acuity: 0,
      intelligence: 0,
      charisma: 0,
    },
    ancestry,
    skills,
  } as Character;
}

describe('migrateSkillsAfterSpeciesChange', () => {
  it('adds new species skills with Codex names, not raw ids', () => {
    const result = migrateSkillsAfterSpeciesChange(
      characterWithSkills([]),
      newAncestry,
      allSpecies,
      allSkills,
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 'skill-ath',
        name: 'Athletics',
        prof: true,
        skill_val: 0,
        ability: 'strength',
      }),
    ]);
  });

  it('does not add a second row when the character already has the skill by name', () => {
    const result = migrateSkillsAfterSpeciesChange(
      characterWithSkills([{ id: 'legacy-ath', name: 'Athletics', skill_val: 1, prof: true }]),
      newAncestry,
      allSpecies,
      allSkills,
    );
    const athletics = result.filter((s) => s.name === 'Athletics');
    expect(athletics).toHaveLength(1);
    expect(athletics[0]?.skill_val).toBe(2);
    expect(athletics[0]?.id).toBe('legacy-ath');
  });

  it('relabels an already-saved id-as-name species skill on the next save', () => {
    const result = migrateSkillsAfterSpeciesChange(
      characterWithSkills(
        [{ id: 'skill-ath', name: 'skill-ath', skill_val: 0, prof: true }],
        newAncestry,
      ),
      newAncestry,
      allSpecies,
      allSkills,
    );
    expect(result).toEqual([
      expect.objectContaining({ id: 'skill-ath', name: 'Athletics', prof: true, skill_val: 0 }),
    ]);
  });

  it('skips the Any species skill id 0', () => {
    const result = migrateSkillsAfterSpeciesChange(
      characterWithSkills([]),
      { id: 'any-sp', name: 'Anyfolk' },
      [{ id: 'any-sp', name: 'Anyfolk', skills: ['0', 'skill-ath'] }, ...allSpecies],
      allSkills,
    );
    expect(result.some((s) => String(s.id) === '0' || s.name === '0')).toBe(false);
    expect(result).toEqual([expect.objectContaining({ id: 'skill-ath', name: 'Athletics' })]);
  });
});
