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

  it('promotes legacy proficiency/defense fields and strips aliases (TASK-663)', () => {
    const cleaned = prepareCharacterForSave({
      name: 'Test',
      level: 1,
      defenseSkills: { might: 1 },
      martialProficiency: 2,
      powerProficiency: 1,
      archetype: { id: 'a1', type: 'mixed' },
    } as unknown as Parameters<typeof prepareCharacterForSave>[0]);

    expect(cleaned.defenseVals).toEqual({ might: 1 });
    expect(cleaned.defenseSkills).toBeUndefined();
    expect(cleaned.mart_prof).toBe(2);
    expect(cleaned.martialProficiency).toBeUndefined();
    expect(cleaned.pow_prof).toBe(1);
    expect(cleaned.powerProficiency).toBeUndefined();
    expect(cleaned.archetype).toEqual({ id: 'a1', type: 'powered-martial' });
  });
});
