/**
 * Campaign Roll Log Types
 * =======================
 * Shared roll log entries stored in Firestore for campaign members.
 */

import type { DieResult } from '@/components/character-sheet/roll-context';

export type CampaignRollType = 'attack' | 'damage' | 'skill' | 'ability' | 'defense' | 'custom';

/** Campaign roll entry stored in Firestore (RollEntry + character attribution) */
export interface CampaignRollEntry {
  id: string;
  characterId: string;
  characterName: string;
  userId: string;
  type: CampaignRollType;
  title: string;
  dice: DieResult[];
  modifier: number;
  total: number;
  isCrit?: boolean;
  isCritFail?: boolean;
  critMessage?: string;
  timestamp: Date | { seconds: number; nanoseconds: number };
}
