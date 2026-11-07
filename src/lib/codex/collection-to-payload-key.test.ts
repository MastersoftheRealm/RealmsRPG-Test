import { describe, expect, it } from 'vitest';
import { TAB_CONFIG } from '@/app/(main)/admin/codex/codex-spreadsheet-config';
import { COLUMNAR_COLLECTIONS, type CodexCollection } from '@/lib/codex/collections';
import {
  CODEX_COLLECTION_TO_PAYLOAD_KEY,
  codexCollectionToPayloadKey,
} from '@/lib/codex/collection-to-payload-key';
import type { CodexPayloadKey } from '@/types/codex';

const COLUMNAR_PAYLOAD_KEYS: readonly CodexPayloadKey[] = [
  'feats',
  'skills',
  'species',
  'traits',
  'parts',
  'itemProperties',
  'equipment',
  'archetypes',
  'creatureFeats',
];

describe('codexCollectionToPayloadKey', () => {
  it('maps every columnar codex table to exactly one payload slice', () => {
    expect(COLUMNAR_COLLECTIONS).toHaveLength(COLUMNAR_PAYLOAD_KEYS.length);
    for (const collection of COLUMNAR_COLLECTIONS) {
      const payloadKey = codexCollectionToPayloadKey(collection);
      expect(payloadKey).toBe(CODEX_COLLECTION_TO_PAYLOAD_KEY[collection]);
      expect(COLUMNAR_PAYLOAD_KEYS).toContain(payloadKey);
    }
    expect(codexCollectionToPayloadKey('core_rules')).toBe('coreRules');
  });

  it('stays aligned with admin spreadsheet tab config (single map source)', () => {
    for (const { collection, apiKey } of Object.values(TAB_CONFIG)) {
      expect(codexCollectionToPayloadKey(collection)).toBe(apiKey);
    }
  });

  it('exposes a total map so callers never hit a silent undefined', () => {
    const collections = Object.keys(CODEX_COLLECTION_TO_PAYLOAD_KEY).sort() as CodexCollection[];
    expect(collections).toEqual([...COLUMNAR_COLLECTIONS, 'core_rules'].sort());
    for (const collection of collections) {
      expect(typeof codexCollectionToPayloadKey(collection)).toBe('string');
    }
  });
});
