import { describe, expect, it } from 'vitest';
import { noAttackCreatorWarning } from './no-attack-creator-warning';

describe('noAttackCreatorWarning', () => {
  it('returns null for technique when attack mode is not none', () => {
    expect(
      noAttackCreatorWarning('technique', {
        attackMode: 'unarmed',
        additionalDamage: { amount: 1, size: 6 },
      }),
    ).toBeNull();
    expect(
      noAttackCreatorWarning('technique', {
        attackMode: 'weapon',
        additionalDamage: { amount: 2, size: 8 },
      }),
    ).toBeNull();
  });

  it('warns for technique No Attack with additional damage dice', () => {
    expect(
      noAttackCreatorWarning('technique', {
        attackMode: 'none',
        additionalDamage: { amount: 1, size: 6 },
      }),
    ).toMatch(/No Attack/);
  });

  it('warns for technique No Attack with True Damage part', () => {
    expect(
      noAttackCreatorWarning('technique', {
        attackMode: 'none',
        manualParts: [{ id: 1, name: 'True Damage' }],
      }),
    ).toMatch(/damage parts/);
  });

  it('does not warn for technique No Attack alone', () => {
    expect(
      noAttackCreatorWarning('technique', {
        attackMode: 'none',
        additionalDamage: { amount: 0, size: 6 },
        manualParts: [{ id: 19, name: 'Expose' }],
      }),
    ).toBeNull();
  });

  it('returns null for power when attack mode is not none', () => {
    expect(
      noAttackCreatorWarning('power', {
        attackMode: 'unarmed',
        areaType: 'cone',
      }),
    ).toBeNull();
  });

  it('warns for power No Attack with cone area', () => {
    expect(
      noAttackCreatorWarning('power', {
        attackMode: 'none',
        areaType: 'cone',
      }),
    ).toMatch(/attack roll/);
  });

  it('warns for power No Attack with Attack / Potency Increase', () => {
    expect(
      noAttackCreatorWarning('power', {
        attackMode: 'none',
        selectedParts: [{ name: 'Attack / Potency Increase' }],
      }),
    ).toMatch(/No Weapon\/Attack/);
  });

  it('does not warn for power No Attack with non-attack parts only', () => {
    expect(
      noAttackCreatorWarning('power', {
        attackMode: 'none',
        areaType: 'none',
        selectedParts: [{ name: 'Immobile' }],
      }),
    ).toBeNull();
  });
});
