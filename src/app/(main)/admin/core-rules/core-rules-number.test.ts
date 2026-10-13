import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CORE_RULES_NUMBER_ERROR_ATTR,
  CORE_RULES_NUMBER_REQUIRED,
  CORE_RULES_NUMBER_SAVE_BLOCKED,
  CORE_RULES_NUMBER_SERVER_NEGATIVE,
  CORE_RULES_NUMBER_TOO_LARGE,
  CORE_RULES_NUMBER_WHOLE,
  coreRulesDocumentNumberError,
  parseCoreRulesNumber,
} from './core-rules-number';

const dir = import.meta.dirname;

describe('core rules number parsing (86e3jtuge)', () => {
  it('does not turn a blank field into 0', () => {
    expect(parseCoreRulesNumber('')).toEqual({ ok: false, message: CORE_RULES_NUMBER_REQUIRED });
    expect(parseCoreRulesNumber('   ')).toEqual({ ok: false, message: CORE_RULES_NUMBER_REQUIRED });
    expect(parseCoreRulesNumber('-')).toEqual({ ok: false, message: CORE_RULES_NUMBER_REQUIRED });
  });

  it('rejects negatives unless the field already allows them', () => {
    expect(parseCoreRulesNumber('-4')).toEqual({ ok: false, message: 'Enter 0 or greater.' });
    expect(parseCoreRulesNumber('-2', { allowNegative: true })).toEqual({ ok: true, value: -2 });
    expect(parseCoreRulesNumber('-3', { allowNegative: true })).toEqual({ ok: true, value: -3 });
    expect(parseCoreRulesNumber('-5', { allowNegative: true })).toEqual({ ok: true, value: -5 });
    expect(parseCoreRulesNumber('-1', { min: 0 })).toEqual({
      ok: false,
      message: 'Enter 0 or greater.',
    });
  });

  it('rejects numbers past the safe integer limit and enforces min and max', () => {
    expect(parseCoreRulesNumber('9007199254740991')).toEqual({
      ok: true,
      value: Number.MAX_SAFE_INTEGER,
    });
    expect(parseCoreRulesNumber('9007199254740992')).toEqual({
      ok: false,
      message: CORE_RULES_NUMBER_TOO_LARGE,
    });
    expect(parseCoreRulesNumber(`1${'0'.repeat(21)}`)).toEqual({
      ok: false,
      message: CORE_RULES_NUMBER_TOO_LARGE,
    });
    expect(parseCoreRulesNumber('1e+21')).toEqual({
      ok: false,
      message: CORE_RULES_NUMBER_TOO_LARGE,
    });
    expect(parseCoreRulesNumber('0', { min: 1 })).toEqual({
      ok: false,
      message: 'Enter 1 or greater.',
    });
    expect(parseCoreRulesNumber('3', { max: 2 })).toEqual({
      ok: false,
      message: 'Enter 2 or less.',
    });
    expect(parseCoreRulesNumber('1.45')).toEqual({ ok: true, value: 1.45 });
    expect(parseCoreRulesNumber('0.5')).toEqual({ ok: true, value: 0.5 });
  });

  it('keeps standard-array values whole, including the negative scores', () => {
    expect(parseCoreRulesNumber('-1', { allowNegative: true, integer: true })).toEqual({
      ok: true,
      value: -1,
    });
    expect(parseCoreRulesNumber('1.5', { allowNegative: true, integer: true })).toEqual({
      ok: false,
      message: CORE_RULES_NUMBER_WHOLE,
    });
  });

  it('rejects unsafe numbers on the server and still stores the penalty fields', () => {
    expect(coreRulesDocumentNumberError('PROGRESSION_PLAYER', { baseHealth: -1 })).toBe(
      CORE_RULES_NUMBER_SERVER_NEGATIVE,
    );
    expect(coreRulesDocumentNumberError('PROGRESSION_PLAYER', { startingCurrency: -50 })).toBe(
      CORE_RULES_NUMBER_SERVER_NEGATIVE,
    );
    expect(
      coreRulesDocumentNumberError('PROGRESSION_PLAYER', { baseHealth: Number.POSITIVE_INFINITY }),
    ).toBe(CORE_RULES_NUMBER_TOO_LARGE);
    expect(coreRulesDocumentNumberError('PROGRESSION_PLAYER', { baseHealth: Number.NaN })).toBe(
      CORE_RULES_NUMBER_REQUIRED,
    );
    expect(
      coreRulesDocumentNumberError('PROGRESSION_CREATURE', { currencyGrowthRate: 1.45 }),
    ).toBeNull();
    expect(
      coreRulesDocumentNumberError('COMBAT', {
        multipleActionPenalty: -5,
        natural1Penalty: -2,
        rangedMeleePenalty: -5,
        longRangePenalty: -5,
        actionCosts: { attack: 2 },
      }),
    ).toBeNull();
    expect(coreRulesDocumentNumberError('COMBAT', { actionCosts: { attack: -1 } })).toBe(
      CORE_RULES_NUMBER_SERVER_NEGATIVE,
    );
    expect(
      coreRulesDocumentNumberError('ABILITY_RULES', {
        min: -2,
        maxTotalNegative: -3,
        standardArrays: { basic: [3, 0, -1] },
      }),
    ).toBeNull();
    expect(coreRulesDocumentNumberError('ABILITY_RULES', { maxStarting: -1 })).toBe(
      CORE_RULES_NUMBER_SERVER_NEGATIVE,
    );
  });

  it('wires the editor so a blank or invalid draft cannot be saved as 0', () => {
    const editors = readFileSync(path.join(dir, 'core-rules-field-editors.tsx'), 'utf8');
    const ability = readFileSync(path.join(dir, 'core-rules-ability-skills-editors.tsx'), 'utf8');
    const page = readFileSync(path.join(dir, 'page.tsx'), 'utf8');

    expect(editors).not.toMatch(/\|\|\s*0/);
    expect(ability).not.toMatch(/parseInt\(/);
    expect(editors).toContain('CORE_RULES_NUMBER_ERROR_ATTR');
    expect(page).toContain('CORE_RULES_NUMBER_SAVE_BLOCKED');
    expect(page).toContain('CORE_RULES_NUMBER_ERROR_ATTR');
    expect(CORE_RULES_NUMBER_ERROR_ATTR).toBe('data-core-rules-number-error');
    expect(CORE_RULES_NUMBER_SAVE_BLOCKED).toBe('Fix the highlighted numbers before saving.');
  });
});
