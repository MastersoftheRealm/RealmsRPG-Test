import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { bootstrapCreatureState } from '@/app/(main)/creature-creator/creature-creator-bootstrap';
import { bootstrapEmpoweredTechniqueFormState } from '@/app/(main)/empowered-technique-creator/empowered-technique-bootstrap';
import { bootstrapItemCreatorFormState } from '@/app/(main)/item-creator/item-creator-bootstrap';
import { bootstrapPowerCreatorFormState } from '@/app/(main)/power-creator/power-creator-bootstrap';
import { bootstrapTechniqueCreatorFormState } from '@/app/(main)/technique-creator/technique-creator-bootstrap';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function installStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  vi.stubGlobal('window', { localStorage });
  vi.stubGlobal('localStorage', localStorage);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('creator ?edit= keeps an unsaved draft when the id is unknown', () => {
  it('restores each creator draft instead of a blank form', () => {
    const store = installStorage();
    const now = Date.now();
    store.set(CREATOR_CACHE_KEYS.POWER, JSON.stringify({ name: 'Draft power', timestamp: now }));
    store.set(
      CREATOR_CACHE_KEYS.TECHNIQUE,
      JSON.stringify({ name: 'Draft technique', timestamp: now }),
    );
    store.set(CREATOR_CACHE_KEYS.ITEM, JSON.stringify({ name: 'Draft armament', timestamp: now }));
    store.set(
      CREATOR_CACHE_KEYS.EMPOWERED_TECHNIQUE,
      JSON.stringify({ name: 'Draft empowered', timestamp: now }),
    );
    store.set(
      CREATOR_CACHE_KEYS.CREATURE,
      JSON.stringify({ creature: { name: 'Draft creature' }, timestamp: now }),
    );

    const badId = '00000000-bad-id';
    expect(
      bootstrapPowerCreatorFormState({ editPowerId: badId, powerParts: [], rawItems: [] }).name,
    ).toBe('Draft power');
    expect(
      bootstrapTechniqueCreatorFormState({
        editTechniqueId: badId,
        techniqueParts: [],
        rawItems: [],
      }).name,
    ).toBe('Draft technique');
    expect(
      bootstrapItemCreatorFormState({ editItemId: badId, itemProperties: [], rawItems: [] }).name,
    ).toBe('Draft armament');
    expect(
      bootstrapEmpoweredTechniqueFormState({
        editId: badId,
        powerParts: [],
        techniqueParts: [],
        rawItems: [],
      }).name,
    ).toBe('Draft empowered');
    expect(bootstrapCreatureState({ editCreatureId: badId, rawItems: [] }).name).toBe(
      'Draft creature',
    );
    expect(store.get(CREATOR_CACHE_KEYS.POWER)).toContain('Draft power');
    expect(store.get(CREATOR_CACHE_KEYS.CREATURE)).toContain('Draft creature');
  });

  it('still loads a library row when the edit id matches', () => {
    installStorage();
    const saved = { id: 'row-1', name: 'Saved power', parts: [] };
    expect(
      bootstrapPowerCreatorFormState({
        editPowerId: 'row-1',
        powerParts: [],
        rawItems: [saved],
      }).name,
    ).toBe('Saved power');
    expect(
      bootstrapTechniqueCreatorFormState({
        editTechniqueId: 'row-1',
        techniqueParts: [],
        rawItems: [{ id: 'row-1', name: 'Saved technique', parts: [] }],
      }).name,
    ).toBe('Saved technique');
    expect(
      bootstrapItemCreatorFormState({
        editItemId: 'row-1',
        itemProperties: [],
        rawItems: [{ id: 'row-1', name: 'Saved armament', type: 'weapon' }],
      }).name,
    ).toBe('Saved armament');
    expect(
      bootstrapCreatureState({
        editCreatureId: 'row-1',
        rawItems: [{ id: 'row-1', name: 'Saved creature' }],
      }).name,
    ).toBe('Saved creature');
  });

  it('does not clear the draft cache for an edit id before the row is confirmed', () => {
    const files = [
      'app/(main)/power-creator/use-power-creator-workspace.ts',
      'app/(main)/technique-creator/use-technique-creator-workspace.ts',
      'app/(main)/item-creator/use-item-creator-workspace.ts',
      'app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts',
      'app/(main)/creature-creator/use-creature-creator-workspace.ts',
    ];
    for (const file of files) {
      const source = readFileSync(join(root, 'src', file), 'utf8');
      expect(source).toContain('useCreatorEditDraftDecision');
      expect(source).not.toMatch(/if \(edit\w*\) clearCreatorCache/);
    }
  });
});
