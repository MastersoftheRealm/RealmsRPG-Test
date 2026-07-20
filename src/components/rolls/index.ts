/**
 * Shared roll domain — used by character sheet, encounters, campaigns, creatures.
 */

export { RollProvider, useRolls, useRollsOptional } from './roll-context';
export type {
  DieResult,
  RollType,
  RollEntry,
  CampaignRollContext,
} from './roll-context';
export { RollLog, RollEntryCard } from './roll-log';
export type { DieType } from '@/lib/rolls/die';
