/**
 * Services Index
 * ===============
 * `generate-feature-index-barrels` requires this file. Callers deep-import
 * (`@/services/character-service`, campaign/crafting/encounter/enhanced-items).
 * Do not add `from '@/services'` — FEATURE_INDEX says deep import only.
 */

export * from './character-service';
export * from './library-service';
