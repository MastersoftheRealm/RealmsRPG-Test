import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import {
  CHARACTER_STARTING_CURRENCY,
  CREATOR_STORE_SCHEMA_VERSION,
  migrateCharacterCreatorPersistedState,
} from './character-creator-store';

// persist() reads localStorage at module load (node vitest has none).
const storage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) delete storage[key];
  },
});

const v1InProgress = {
  currentStep: 'skills' as const,
  completedSteps: ['archetype', 'species', 'ancestry', 'abilities'] as const,
  draft: {
    name: 'Hero',
    level: 1,
    abilities: { ...DEFAULT_ABILITIES, strength: 2, intelligence: 1 },
    creationMode: 'path' as const,
    archetypePathId: 'path-a',
    currency: 150,
    skills: { '10': 1 },
  },
};

describe('migrateCharacterCreatorPersistedState', () => {
  it('keeps a v1 in-progress draft when migrating to the current schema', () => {
    const migrated = migrateCharacterCreatorPersistedState(v1InProgress, 1);

    expect(migrated.currentStep).toBe('skills');
    expect(migrated.completedSteps).toEqual([
      'archetype',
      'species',
      'ancestry',
      'abilities',
    ]);
    expect(migrated.draft.name).toBe('Hero');
    expect(migrated.draft.abilities).toEqual({
      ...DEFAULT_ABILITIES,
      strength: 2,
      intelligence: 1,
    });
    expect(migrated.draft.currency).toBe(150);
    expect(migrated.draft.skills).toEqual({ '10': 1 });
    expect(migrated.draft.archetypePathId).toBe('path-a');
    expect(migrated.stepLayer).toEqual({});
  });

  it('backfills missing fields from defaults without wiping known values', () => {
    const migrated = migrateCharacterCreatorPersistedState(
      {
        currentStep: 'feats',
        completedSteps: ['archetype'],
        draft: { name: 'Partial' },
      },
      1
    );

    expect(migrated.draft.name).toBe('Partial');
    expect(migrated.draft.abilities).toEqual({ ...DEFAULT_ABILITIES });
    expect(migrated.draft.currency).toBe(CHARACTER_STARTING_CURRENCY);
    expect(migrated.draft.level).toBe(1);
    expect(migrated.currentStep).toBe('feats');
  });

  it('returns a fresh draft for invalid persisted payloads', () => {
    const migrated = migrateCharacterCreatorPersistedState(null, 1);
    expect(migrated.currentStep).toBe('archetype');
    expect(migrated.completedSteps).toEqual([]);
    expect(migrated.draft.name).toBe('');
    expect(migrated.draft.abilities).toEqual({ ...DEFAULT_ABILITIES });
  });

  it('does not replace a valid draft when the schema version is bumped past v1', () => {
    expect(CREATOR_STORE_SCHEMA_VERSION).toBeGreaterThan(1);
    const migrated = migrateCharacterCreatorPersistedState(
      v1InProgress,
      CREATOR_STORE_SCHEMA_VERSION - 1
    );
    expect(migrated.draft.name).toBe('Hero');
    expect(migrated.currentStep).toBe('skills');
    expect(migrated.draft).not.toEqual({
      name: '',
      level: 1,
      abilities: { ...DEFAULT_ABILITIES },
      step: 0,
      isComplete: false,
      currency: CHARACTER_STARTING_CURRENCY,
    });
  });

  it('keeps a valid clientRequestId and drops a malformed one', () => {
    const uuid = '11111111-2222-4333-8444-555555555555';
    const kept = migrateCharacterCreatorPersistedState(
      { ...v1InProgress, draft: { ...v1InProgress.draft, clientRequestId: uuid } },
      3
    );
    expect(kept.draft.clientRequestId).toBe(uuid);

    const dropped = migrateCharacterCreatorPersistedState(
      { ...v1InProgress, draft: { ...v1InProgress.draft, clientRequestId: 'not-a-uuid' } },
      3
    );
    expect(dropped.draft.clientRequestId).toBeUndefined();
  });
});
