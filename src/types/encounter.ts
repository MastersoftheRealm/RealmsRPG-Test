/**
 * Encounter Types
 * ================
 * Types for the Encounters system (combat, skill, mixed).
 * Extends existing Combatant types from encounter-tracker.
 */

import type { Combatant, CombatantCondition, CombatantType, ConditionDef } from '@/app/(main)/encounter-tracker/encounter-tracker-types';

// Re-export shared types for convenience
export type { Combatant, CombatantCondition, CombatantType, ConditionDef };

/** Type of encounter */
export type EncounterType = 'combat' | 'skill' | 'mixed';

/** Status of an encounter */
export type EncounterStatus = 'preparing' | 'active' | 'paused' | 'completed';

/** Source type for combatants added from library/campaign */
export type CombatantSource = 'manual' | 'creature-library' | 'campaign-character';

/** Extended combatant with source tracking */
export interface TrackedCombatant extends Combatant {
  /** Where this combatant was added from */
  sourceType?: CombatantSource;
  /** Original ID (creature library ID or character ID) */
  sourceId?: string;
  /** When sourceType is campaign-character, the character owner's user ID (for HP/EN sync) */
  sourceUserId?: string;
}

/** A participant in a skill encounter */
export interface SkillParticipant {
  id: string;
  name: string;
  hasRolled: boolean;
  rollValue?: number;
  /** Successes contributed by this roll (1 + floor((roll-DS)/5) when roll >= DS) */
  successCount?: number;
  /** Failures contributed by this roll (1 + floor((DS-roll)/5) when roll < DS) */
  failureCount?: number;
  isSuccess?: boolean; // legacy, derived from successCount > 0
  skillUsed?: string;
  notes?: string;
  /** When true, participant helped but roll doesn't count toward encounter totals */
  isHelping?: boolean;
  /** RM bonus applied to this participant's roll (e.g. +2, +4) for situational benefits */
  rmBonus?: number;
  /** Source tracking */
  sourceType?: CombatantSource;
  sourceId?: string;
  sourceUserId?: string;
}

/** State for a skill encounter */
export interface SkillEncounterState {
  /** Difficulty Score — default: 10 + floor(partyLevel / 2) */
  difficultyScore: number;
  /** Participants in the skill encounter */
  participants: SkillParticipant[];
  /** Running total of successes (each 5 over DS = +1) */
  currentSuccesses: number;
  /** Running total of failures (each 5 under DS = +1). Net = successes - failures */
  currentFailures: number;
  /** RM-added successes (buttons "Additional Success") */
  additionalSuccesses?: number;
  /** RM-added failures (buttons "Additional Failure") */
  additionalFailures?: number;
  /** @deprecated Legacy: optional target for successes (mixed page) */
  requiredSuccesses?: number;
  /** @deprecated Legacy: optional target for failures (mixed page) */
  requiredFailures?: number;
}

/** Full encounter document stored in Prisma */
export interface Encounter {
  id: string;
  name: string;
  description?: string;
  type: EncounterType;
  status: EncounterStatus;

  /** Optional campaign; when set, "Add all Characters" adds all campaign characters. */
  campaignId?: string;

  // Combat state (combat + mixed)
  combatants: TrackedCombatant[];
  round: number;
  currentTurnIndex: number;
  isActive: boolean;
  applySurprise: boolean;
  /** When true, initiative is re-sorted at the start of each new round (e.g. after deaths). */
  autoSortInitiative?: boolean;

  // Skill state (skill + mixed)
  skillEncounter?: SkillEncounterState;

  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/** Summary for list views */
export interface EncounterSummary {
  id: string;
  name: string;
  description?: string;
  type: EncounterType;
  status: EncounterStatus;
  combatantCount: number;
  participantCount: number;
  round: number;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

/** Default values for creating a new encounter */
export function createDefaultEncounter(
  type: EncounterType,
  name: string,
  description?: string
): Omit<Encounter, 'id'> {
  return {
    name,
    description,
    type,
    status: 'preparing',
    combatants: [],
    round: 0,
    currentTurnIndex: -1,
    isActive: false,
    applySurprise: false,
    ...(type === 'skill' || type === 'mixed'
      ? {
          skillEncounter: {
            difficultyScore: 10,
            participants: [],
            currentSuccesses: 0,
            currentFailures: 0,
          },
        }
      : {}),
  };
}
