import { describe, expect, it } from 'vitest';
import {
  deriveEmpoweredAttackMode,
  derivePowerAttackMode,
  deriveTechniqueAttackMode,
} from './attack-mode';

describe('deriveEmpoweredAttackMode', () => {
  it('prefers explicit attackMode', () => {
    expect(
      deriveEmpoweredAttackMode({
        attackMode: 'unarmed',
        parts: [{ id: 7, name: 'Add Weapon to Technique' }],
      }),
    ).toBe('unarmed');
  });

  it('detects weapon from Add Weapon to Technique', () => {
    expect(
      deriveEmpoweredAttackMode({
        parts: [{ id: 7, name: 'Add Weapon to Technique' }],
      }),
    ).toBe('weapon');
  });

  it('detects weapon from Add Weapon to Power', () => {
    expect(
      deriveEmpoweredAttackMode({
        parts: [{ id: 369, name: 'Add Weapon to Power' }],
      }),
    ).toBe('weapon');
  });

  it('defaults unlabeled or No Attack-only rows to none (legacy parity)', () => {
    expect(deriveEmpoweredAttackMode({ parts: [] })).toBe('none');
    expect(
      deriveEmpoweredAttackMode({
        parts: [{ id: 415, name: 'No Attack' }],
      }),
    ).toBe('none');
  });
});

describe('derivePowerAttackMode / deriveTechniqueAttackMode smoke', () => {
  it('power defaults to none; technique defaults to unarmed', () => {
    expect(derivePowerAttackMode({ parts: [] })).toBe('none');
    expect(deriveTechniqueAttackMode({ parts: [] })).toBe('unarmed');
  });
});
