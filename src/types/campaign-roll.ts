/**
 * Campaign Roll Log Types
 * =======================
 * Shared roll log entries stored in the database for campaign members.
 */

import type { DieResult } from '@/components/rolls/roll-context';
import type { LegacyFirestoreTimestamp, RollTimestampInput } from '@/lib/roll-timestamp';

export type CampaignRollType = 'attack' | 'damage' | 'skill' | 'ability' | 'defense' | 'custom';

/** Stored/API roll timestamp — ISO string, Date, or legacy Firestore shape. */
export type CampaignRollTimestamp = RollTimestampInput | LegacyFirestoreTimestamp;

/** Campaign roll entry stored in the database (RollEntry + character attribution) */
export interface CampaignRollEntry {
  id: string;
  characterId: string;
  characterName: string;
  userId: string;
  type: CampaignRollType;
  title: string;
  dice: DieResult[];
  modifier: number;
  modifierLabel?: string | undefined;
  total: number;
  isCrit?: boolean | undefined;
  isCritFail?: boolean | undefined;
  critMessage?: string | undefined;
  timestamp: CampaignRollTimestamp;
}
