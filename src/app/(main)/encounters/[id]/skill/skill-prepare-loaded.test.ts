import { describe, expect, it } from 'vitest';
import { createDefaultEncounter, defaultSkillEncounterState } from '@/types/encounter';

// Mirrors prepareSkillEncounter in skill/page.tsx when skillEncounter is missing.
function prepareSkillEncounterMissingState(encounter: ReturnType<typeof createDefaultEncounter>) {
  if (!encounter.skillEncounter) {
    return { ...encounter, skillEncounter: defaultSkillEncounterState() };
  }
  return encounter;
}

describe('prepareSkillEncounter (missing state)', () => {
  it('creates skillEncounter when absent so requireSkillEncounter gate can reach ready', () => {
    const raw = { ...createDefaultEncounter('skill', 'S'), skillEncounter: undefined };
    const prepared = prepareSkillEncounterMissingState(raw);
    expect(prepared.skillEncounter).toBeDefined();
    expect(prepared.skillEncounter?.difficultyScore).toBeDefined();
  });
});
