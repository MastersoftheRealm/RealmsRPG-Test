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
  portrait?: string;
  level: number;
  species?: string;
  archetype?: ArchetypeDisplayName;
  /** Username of the character owner (for display) */
  ownerUsername?: string;
}

/** Full campaign document */
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  /** Realm Master - owner of the campaign */
  ownerId: string;
  /** Username of the Realm Master */
  ownerUsername?: string;
  /** Unique invite code for joining */
  inviteCode: string;
  /** Characters in the campaign (owner can add up to 5 of their own; others add 1 when joining) */
  characters: CampaignCharacter[];
  /** User IDs with characters in the campaign (for Firestore security rules) */
  memberIds: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/** Campaign summary for list views */
export interface CampaignSummary {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerUsername?: string;
  characterCount: number;
  isOwner: boolean;
  updatedAt?: Date | string;
}
