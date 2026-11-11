import { describe, expect, it } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';

// Mirrors prepareMixedEncounter in mixed/page.tsx (must stay in sync — kills removing prepareLoaded).
function prepareMixedEncounter(encounter: ReturnType<typeof createDefaultEncounter>) {
  if (!encounter.skillEncounter) {
    return {
      ...encounter,
      skillEncounter: { ...defaultSkillEncounterState(), useInitiative: true },
    };
  }
  return encounter;
}

describe('prepareMixedEncounter', () => {
  it('hydrates missing skillEncounter so mixed skill tab is not stuck initializing', () => {
    const raw = { ...createDefaultEncounter('mixed', 'M'), skillEncounter: undefined };
    const prepared = prepareMixedEncounter(raw);
    expect(prepared.skillEncounter).toBeDefined();
    expect(prepared.skillEncounter?.useInitiative).toBe(true);
  });
});
