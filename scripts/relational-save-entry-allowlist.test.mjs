import { describe, expect, it } from 'vitest';
import { RELATIONAL_SAVE_ENTRY_ALLOWLIST } from '../src/lib/character/relational-lean-save.ts';
import { loadSqlEntryAllowlistsFromExpand } from './lib/relational-save-entry-allowlist.mjs';

describe('relational save entry allow-list SQL parity', () => {
  it('matches assert_character_document_mapped entry keys in expand.sql', () => {
    const fromSql = loadSqlEntryAllowlistsFromExpand();
    for (const [collection, expected] of Object.entries(RELATIONAL_SAVE_ENTRY_ALLOWLIST)) {
      expect(fromSql[collection], `missing SQL allow-list for ${collection}`).toBeDefined();
      expect([...expected].sort()).toEqual([...fromSql[collection]].sort());
    }
  });
});
