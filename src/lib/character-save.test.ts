import { describe, expect, it } from 'vitest';
import { prepareCharacterForSave } from './character-save';

describe('prepareCharacterForSave (ADR-0006 tempModifiers)', () => {
  it('normalizes sparse tempModifiers and drops all-zero maps', () => {
    const cleaned = prepareCharacterForSave({
      name: 'Test',
      level: 1,
      tempModifiers: {
        speed: 0,
        evasion: 2,
        abilities: { strength: 0, vitality: 1 },
      },
    } as Parameters<typeof prepareCharacterForSave>[0]);

    expect(cleaned.tempModifiers).toEqual({
      evasion: 2,
      abilities: { vitality: 1 },
    });
  });

  it('omits tempModifiers when nothing remains', () => {
    const cleaned = prepareCharacterForSave({
      name: 'Test',
      level: 1,
      tempModifiers: { speed: 0 },
    } as Parameters<typeof prepareCharacterForSave>[0]);

    expect(cleaned.tempModifiers).toBeUndefined();
  });
});
