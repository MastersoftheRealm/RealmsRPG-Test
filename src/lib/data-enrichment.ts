/**
 * Data Enrichment Utilities
 * ==========================
 * Pairs raw character data with full objects from user's library
 * Mirrors the vanilla site's data-enrichment.js patterns
 */

export type {
  EnrichedPower,
  EnrichedTechnique,
  EnrichedItem,
  CodexEquipmentItem,
  EnrichedCharacterData,
} from './data-enrichment/types';

export { enrichCharacterData } from './data-enrichment/enrich-character';
export { cleanForSave } from './data-enrichment/clean-for-save';
