/**
 * Campaign Types
 * ===============
 * Campaign data structures for multi-user character groups
 */

/** Archetype display names for campaign roster */
export type ArchetypeDisplayName = 'Power' | 'Martial' | 'Powered-Martial';

/** A character slot in a campaign (owned by a user) */
export interface CampaignCharacter {
  userId: string;
  characterId: string;
  characterName: string;
  portrait?: string | undefined;
  level: number;
  species?: string | undefined;
  archetype?: ArchetypeDisplayName | undefined;
  /** Username of the character owner (for display) */
  ownerUsername?: string | undefined;
}

/** Full campaign document */
export interface Campaign {
  id: string;
  name: string;
  description?: string | undefined;
  /** Realm Master - owner of the campaign */
  ownerId: string;
  /** Username of the Realm Master */
  ownerUsername?: string | undefined;
  /** Unique invite code for joining */
  inviteCode: string;
  /** Characters in the campaign (owner can add up to 5 of their own; others add 1 when joining) */
  characters: CampaignCharacter[];
  /** User IDs with characters in the campaign (for access control) */
  memberIds: string[];
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
}

/** Campaign summary for list views */
export interface CampaignSummary {
  id: string;
  name: string;
  description?: string | undefined;
  ownerId: string;
  ownerUsername?: string | undefined;
  characterCount: number;
  isOwner: boolean;
  updatedAt?: Date | string | undefined;
}

/** Minimal character payload from GET ?scope=encounter (combatant add / HP sync). */
export interface CampaignCharacterEncounterData {
  currentHealth?: number | undefined;
  currentEnergy?: number | undefined;
  actionPoints?: number | undefined;
  health?: { current?: number | undefined; max?: number | undefined } | undefined;
  energy?: { current?: number | undefined; max?: number | undefined } | undefined;
  abilities?: { acuity?: number | undefined; agility?: number | undefined } | undefined;
  evasion?: number | undefined;
}
