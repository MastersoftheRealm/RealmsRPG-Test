import { describe, expect, it } from 'vitest';
import {
  clampSavedCurrency,
  prepareCharacterForCreate,
  prepareCharacterForSave,
  resolveClientRequestId,
} from './character-save';

describe('clampSavedCurrency (TASK-739)', () => {
  it('floors a signed remainder at 0', () => {
    expect(clampSavedCurrency(40)).toBe(40);
    expect(clampSavedCurrency(0)).toBe(0);
    expect(clampSavedCurrency(-25)).toBe(0);
  });
});

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

  it('floors currency when the key is present and does not invent it (TASK-749)', () => {
    const withDebt = prepareCharacterForSave({
      name: 'Test',
      level: 1,
      currency: -10,
    } as Parameters<typeof prepareCharacterForSave>[0]);
    expect(withDebt.currency).toBe(0);

    const omitted = prepareCharacterForSave({
      name: 'Test',
      level: 1,
    } as Parameters<typeof prepareCharacterForSave>[0]);
    expect(omitted).not.toHaveProperty('currency');
  });
});

describe('create idempotency key (TASK-738)', () => {
  it('reuses a valid uuid and mints a new one otherwise', () => {
    const existing = '11111111-2222-4333-8444-555555555555';
    expect(resolveClientRequestId(existing)).toBe(existing);
    expect(resolveClientRequestId('not-a-uuid')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('strips clientRequestId from the saved JSON blob on create', () => {
    const cleaned = prepareCharacterForCreate({
      name: 'Test',
      level: 1,
      clientRequestId: '11111111-2222-4333-8444-555555555555',
    } as never);
    expect(cleaned.clientRequestId).toBeUndefined();
    expect(cleaned.name).toBe('Test');
  });
});
