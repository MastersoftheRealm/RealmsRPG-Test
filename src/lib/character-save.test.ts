import { describe, expect, it } from 'vitest';
import {
  clampSavedCurrency,
  formatCharacterCreateFailureMessage,
  prepareCharacterForCreate,
  prepareCharacterForSave,
  resolveClientRequestId,
} from './character-save';
import { ApiError } from './api-client';

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
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
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

describe('formatCharacterCreateFailureMessage (TASK-754)', () => {
  const copy = {
    saveFailed: 'Could not create your character. Please try again.',
    saveRetryHint: 'Check My Characters before trying again so you do not create a duplicate.',
  };

  it('keeps the 400 legality message (violation list), without the duplicate hint', () => {
    const err = new ApiError(
      'Character is not a legal level 1 build: Ability points spent (9) exceed the level 1 budget (7).',
      400,
    );
    const message = formatCharacterCreateFailureMessage(err, copy);
    expect(message).toContain('Ability points spent');
    expect(message).not.toMatch(/My Characters|duplicate/i);
  });

  it('uses saveFailed for a 500 and does not mention My Characters', () => {
    const err = new ApiError('Failed to create character', 500, {
      error: 'Failed to create character',
      message: 'column codex_skills.base_skill_id does not exist',
      hint: 'codex_skills.base_skill',
      code: '42703',
    });
    expect(formatCharacterCreateFailureMessage(err, copy)).toBe(copy.saveFailed);
  });

  it('keeps player-facing 403 quota copy', () => {
    const err = new ApiError('You have reached the character limit for your role.', 403);
    expect(formatCharacterCreateFailureMessage(err, copy)).toBe(
      'You have reached the character limit for your role.',
    );
  });

  it('appends the My Characters hint only when the POST may already have a row', () => {
    expect(formatCharacterCreateFailureMessage(new TypeError('Failed to fetch'), copy)).toBe(
      `${copy.saveFailed} ${copy.saveRetryHint}`,
    );
    expect(
      formatCharacterCreateFailureMessage({ name: 'AbortError', message: 'aborted' }, copy),
    ).toBe(`${copy.saveFailed} ${copy.saveRetryHint}`);
  });
});
