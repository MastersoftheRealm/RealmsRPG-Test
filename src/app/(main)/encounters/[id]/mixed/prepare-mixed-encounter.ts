import type { Encounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';

export function prepareMixedEncounter(encounter: Encounter): Encounter {
  if (!encounter.skillEncounter) {
    // Mixed encounter: default to initiative so turn order can sync with combat.
    return {
      ...encounter,
      skillEncounter: { ...defaultSkillEncounterState(), useInitiative: true },
    };
  }

  const skill = encounter.skillEncounter;
  const participants = skill.participants ?? [];
  return {
    ...encounter,
    skillEncounter: {
      ...skill,
      participants,
      additionalSuccesses: skill.additionalSuccesses ?? 0,
      additionalFailures: skill.additionalFailures ?? 0,
      requiredSuccesses: skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
      useInitiative: skill.useInitiative ?? true,
    },
  };
}
