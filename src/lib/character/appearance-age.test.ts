import { describe, expect, it } from 'vitest';
import {
  parseAgeFromAppearance,
  stripAgeFromAppearance,
  resolveCharacterAge,
  resolveCharacterAppearance,
  resolveCharacterBackstory,
  normalizeAgeAppearanceForSave,
} from '@/lib/character/appearance-age';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import type { Character } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';

describe('appearance-age', () => {
  it('parses and strips legacy Age prefix from appearance', () => {
    const appearance = 'Age: 42\nTall with red hair.';
    expect(parseAgeFromAppearance(appearance)).toBe('42');
    expect(stripAgeFromAppearance(appearance)).toBe('Tall with red hair.');
  });

  it('prefers dedicated age field over legacy appearance prefix', () => {
    expect(resolveCharacterAge('30', 'Age: 42\nTall.')).toBe('30');
    expect(resolveCharacterAge(undefined, 'Age: 42\nTall.')).toBe('42');
  });

  it('resolves appearance without legacy age line', () => {
    expect(resolveCharacterAppearance('Age: 42\nTall with red hair.')).toBe('Tall with red hair.');
  });

  it('falls back to description for legacy backstory saves', () => {
    expect(resolveCharacterBackstory(undefined, '  Former sailor.  ')).toBe('Former sailor.');
    expect(resolveCharacterBackstory('Chosen path.', 'Former sailor.')).toBe('Chosen path.');
  });

  it('normalizeAgeAppearanceForSave promotes age and strips legacy prefix on save', () => {
    const data: Record<string, unknown> = {
      appearance: 'Age: 42\nTall with red hair.',
    };
    normalizeAgeAppearanceForSave(data);
    expect(data.age).toBe('42');
    expect(data.appearance).toBe('Tall with red hair.');
  });

  it('normalizeAgeAppearanceForSave strips prefix when age field already set', () => {
    const data: Record<string, unknown> = {
      age: '30',
      appearance: 'Age: 42\nTall with red hair.',
    };
    normalizeAgeAppearanceForSave(data);
    expect(data.age).toBe('30');
    expect(data.appearance).toBe('Tall with red hair.');
  });

  it('normalizeAgeAppearanceForSave drops empty appearance after stripping age-only prefix', () => {
    const data: Record<string, unknown> = { appearance: 'Age: 19' };
    normalizeAgeAppearanceForSave(data);
    expect(data.age).toBe('19');
    expect(data.appearance).toBeUndefined();
  });

  it('cleanForSave migrates legacy age prefix out of appearance', () => {
    const saved = cleanForSave({
      id: 'c1',
      name: 'Legacy',
      level: 1,
      abilities: DEFAULT_ABILITIES,
      appearance: 'Age: 42\nTall with red hair.',
    } as Character);

    expect(saved.age).toBe('42');
    expect(saved.appearance).toBe('Tall with red hair.');
  });
});
