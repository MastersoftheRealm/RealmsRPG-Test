import { describe, expect, it } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import { prepareSkillEncounter } from './prepare-skill-encounter';

describe('prepareSkillEncounter (missing state)', () => {
  it('creates skillEncounter when absent so requireSkillEncounter gate can reach ready', () => {
    const raw = {
      ...createDefaultEncounter('skill', 'S'),
      id: 'skill-1',
      skillEncounter: undefined,
    };
    const prepared = prepareSkillEncounter(raw);
    expect(prepared.skillEncounter).toBeDefined();
    expect(prepared.skillEncounter?.difficultyScore).toBeDefined();
  });
});
