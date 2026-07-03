import { describe, expect, it } from 'vitest';
import { CODEX_PAYLOAD_KEYS, type CodexPayload } from '../types/codex';

/** Empty codex payload — shape contract for fetchCodex / useCodex* selectors. */
function emptyCodexPayload(): CodexPayload {
  return {
    feats: [],
    skills: [],
    species: [],
    traits: [],
    powerParts: [],
    techniqueParts: [],
    parts: [],
    itemProperties: [],
    equipment: [],
    archetypes: [],
    creatureFeats: [],
    coreRules: {},
  };
}

describe('CodexPayload shape', () => {
  it('defines all collection keys returned by GET /api/codex', () => {
    const payload = emptyCodexPayload();
    for (const key of CODEX_PAYLOAD_KEYS) {
      expect(payload).toHaveProperty(key);
    }
    expect(Object.keys(payload).sort()).toEqual([...CODEX_PAYLOAD_KEYS].sort());
  });

  it('useCodex* selectors read typed slices without optional chaining on missing keys', () => {
    const payload = emptyCodexPayload();
    expect(payload.feats).toEqual([]);
    expect(payload.skills).toEqual([]);
    expect(payload.archetypes).toEqual([]);
    expect(payload.coreRules).toEqual({});
  });
});
