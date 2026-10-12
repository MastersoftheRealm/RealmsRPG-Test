import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  normalizeArchetypeCategoryValue,
  normalizeArchetypeChoices,
  normalizeCharacterForSave,
  normalizeCharacterOnLoad,
  resolveDefenseVals,
  resolveMartProf,
  resolvePowProf,
} from './schema-normalize';

describe('schema-normalize (TASK-663)', () => {
  it('maps legacy mixed archetype type to powered-martial', () => {
    expect(normalizeArchetypeCategoryValue('mixed')).toBe('powered-martial');
    expect(normalizeArchetypeCategoryValue('power')).toBe('power');
    expect(normalizeArchetypeCategoryValue('bogus')).toBeUndefined();
  });

  it('dual-reads legacy proficiency and defense field names', () => {
    expect(resolveMartProf({ martialProficiency: 2 })).toBe(2);
    expect(resolveMartProf({ mart_prof: 3 })).toBe(3);
    expect(resolvePowProf({ powerProficiency: 1 })).toBe(1);
    expect(resolveDefenseVals({ defenseSkills: { might: 1 } })).toEqual({ might: 1 });
    expect(resolveDefenseVals({ defenseVals: { reflex: 2 }, defenseSkills: { might: 1 } })).toEqual(
      {
        reflex: 2,
      },
    );
  });

  it('normalizeArchetypeChoices coerces JSON string keys (86e3jvjh4)', () => {
    expect(normalizeArchetypeChoices({ '4': 'innate', '7': 'feat', 10: 'innate' })).toEqual({
      4: 'innate',
      7: 'feat',
      10: 'innate',
    });
    expect(normalizeArchetypeChoices({ bad: 'innate', 4: 'other' })).toEqual({});
  });

  it('normalizeCharacterOnLoad promotes legacy fields to canonical keys', () => {
    const loaded = normalizeCharacterOnLoad({
      defenseSkills: { might: 1 },
      martialProficiency: 2,
      powerProficiency: 1,
      archetype: { id: 'path-1', type: 'mixed' },
    }) as Record<string, unknown>;

    expect(loaded.defenseVals).toEqual({ might: 1 });
    expect(loaded.defenseSkills).toBeUndefined();
    expect(loaded.mart_prof).toBe(2);
    expect(loaded.martialProficiency).toBeUndefined();
    expect(loaded.pow_prof).toBe(1);
    expect(loaded.powerProficiency).toBeUndefined();
    expect(loaded.archetype).toEqual({ id: 'path-1', type: 'powered-martial' });
  });

  it('normalizeCharacterOnLoad normalizes archetypeChoices keys from JSONB', () => {
    const loaded = normalizeCharacterOnLoad({
      archetypeChoices: { '4': 'innate', '7': 'feat' },
    }) as Record<string, unknown>;
    expect(loaded.archetypeChoices).toEqual({ 4: 'innate', 7: 'feat' });
  });

  it('normalizeCharacterForSave writes canonical fields and strips legacy aliases', () => {
    const payload: Record<string, unknown> = {
      defenseSkills: { fortitude: 1 },
      martialProficiency: 2,
      powerProficiency: 1,
      archetype: { id: 'path-1', type: 'mixed' },
    };

    normalizeCharacterForSave(payload);

    expect(payload.defenseVals).toEqual({ fortitude: 1 });
    expect(payload.defenseSkills).toBeUndefined();
    expect(payload.mart_prof).toBe(2);
    expect(payload.martialProficiency).toBeUndefined();
    expect(payload.pow_prof).toBe(1);
    expect(payload.powerProficiency).toBeUndefined();
    expect(payload.archetype).toEqual({ id: 'path-1', type: 'powered-martial' });
  });

  it('cleanForSave promotes legacy-only character fields to canonical save shape', () => {
    const lean = cleanForSave({
      name: 'Legacy',
      level: 1,
      defenseSkills: { might: 1 },
      martialProficiency: 2,
      powerProficiency: 1,
      archetype: { id: 'path-1', type: 'mixed' },
    } as unknown as Character);

    expect(lean.defenseVals).toEqual({ might: 1 });
    expect(lean.defenseSkills).toBeUndefined();
    expect(lean.mart_prof).toBe(2);
    expect(lean.martialProficiency).toBeUndefined();
    expect(lean.pow_prof).toBe(1);
    expect(lean.powerProficiency).toBeUndefined();
    expect(lean.archetype).toEqual({ id: 'path-1', type: 'powered-martial' });
  });
});
