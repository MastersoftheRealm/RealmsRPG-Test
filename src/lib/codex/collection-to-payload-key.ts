import type { CodexCollection } from '@/lib/codex/collections';
import type { CodexPayloadKey } from '@/types/codex';

const COLLECTION_TO_PAYLOAD_KEY: Partial<Record<CodexCollection, CodexPayloadKey>> = {
  codex_feats: 'feats',
  codex_skills: 'skills',
  codex_species: 'species',
  codex_traits: 'traits',
  codex_parts: 'parts',
  codex_properties: 'itemProperties',
  codex_equipment: 'equipment',
  codex_archetypes: 'archetypes',
  codex_creature_feats: 'creatureFeats',
  core_rules: 'coreRules',
};

export function codexCollectionToPayloadKey(
  collection: CodexCollection,
): CodexPayloadKey | undefined {
  return COLLECTION_TO_PAYLOAD_KEY[collection];
}
