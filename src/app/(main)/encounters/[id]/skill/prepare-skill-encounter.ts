import type { Encounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';

export function prepareSkillEncounter(encounter: Encounter): Encounter {
  if (!encounter.skillEncounter) {
    return { ...encounter, skillEncounter: defaultSkillEncounterState() };
  }

  const skill = encounter.skillEncounter;
  const participants = skill.participants ?? [];
  const difficultyScore = skill.difficultyScore ?? 10;
  return {
    ...encounter,
    skillEncounter: {
      ...skill,
      difficultyScore,
      participants: participants.map((participant) => {
        if (
          participant.hasRolled &&
          participant.rollValue != null &&
          participant.successCount == null &&
          participant.failureCount == null
        ) {
          const { successes, failures } = computeSkillRollResult(
            participant.rollValue + (participant.rmBonus ?? 0),
            difficultyScore,
          );
          return {
            ...participant,
            successCount: successes,
            failureCount: failures,
          };
        }
        return participant;
      }),
      additionalSuccesses: skill.additionalSuccesses ?? 0,
      additionalFailures: skill.additionalFailures ?? 0,
      requiredSuccesses: skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
    },
  };
}
