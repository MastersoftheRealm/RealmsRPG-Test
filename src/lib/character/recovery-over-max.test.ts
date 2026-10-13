import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  autoRecoveryQuarters,
  formatPartialRecoveryDuration,
  formatRecoveredAmount,
  partialAmountRestored,
  quarterRestoreAmount,
  resourceAfterFullRecovery,
  resourceAfterPartialRecovery,
} from './recovery-over-max';

describe('recovery does not lower over-max Health or Energy (86e3jv000)', () => {
  it('partial 2h auto on Health 25/20 and Energy 5/18 restores 0 HP and 10 EN', () => {
    const quarters = autoRecoveryQuarters({
      totalQuarters: 2,
      currentHealth: 25,
      maxHealth: 20,
      currentEnergy: 5,
      maxEnergy: 18,
    });

    expect(quarters).toEqual({ hp: 0, en: 2 });

    const hp = partialAmountRestored(quarters.hp, quarterRestoreAmount(20), 25, 20);
    const en = partialAmountRestored(quarters.en, quarterRestoreAmount(18), 5, 18);

    expect(hp).toBe(0);
    expect(en).toBe(10);
    expect(formatRecoveredAmount(hp)).toBe('+0');
    expect(formatRecoveredAmount(en)).toBe('+10');
    expect(formatRecoveredAmount(hp).includes('+-')).toBe(false);
    expect(formatRecoveredAmount(en).startsWith('-')).toBe(false);
    expect(resourceAfterPartialRecovery(25, hp, 20)).toBe(25);
    expect(resourceAfterPartialRecovery(5, en, 18)).toBe(15);
  });

  it('does not lower Energy 25/18 or show a negative recovered amount', () => {
    const restored = partialAmountRestored(0, quarterRestoreAmount(18), 25, 18);

    expect(restored).toBe(0);
    expect(formatRecoveredAmount(restored)).toBe('+0');
    expect(formatRecoveredAmount(-7)).toBe('+0');
    expect(resourceAfterPartialRecovery(25, -7, 18)).toBe(25);
    expect(resourceAfterFullRecovery(25, 18)).toBe(25);
  });

  it('full recovery keeps Health 25/20 and raises Energy 5/18 to 18', () => {
    expect(resourceAfterFullRecovery(25, 20)).toBe(25);
    expect(resourceAfterFullRecovery(5, 18)).toBe(18);
  });

  it('partial recovery still fills up to max and does not pass it', () => {
    expect(partialAmountRestored(1, quarterRestoreAmount(20), 18, 20)).toBe(2);
    expect(resourceAfterPartialRecovery(18, 2, 20)).toBe(20);
    expect(resourceAfterPartialRecovery(10, 5, 20)).toBe(15);
    expect(resourceAfterFullRecovery(10, 20)).toBe(20);
  });

  it('a negative restored amount does not lower Health that is under max', () => {
    expect(resourceAfterPartialRecovery(10, -5, 20)).toBe(10);
    expect(resourceAfterPartialRecovery(25, -5, 20)).toBe(25);
  });
});

describe('partial recovery duration sentences keep their spaces (86e3jv01b)', () => {
  it.each([2, 4, 6])('puts a space before %sh', (hours) => {
    const text = formatPartialRecoveryDuration({
      hours,
      quarters: hours,
      hpPerQuarter: 5,
      enPerQuarter: 4,
    });

    expect(text).toContain(`freely). ${hours}h`);
    expect(text).toContain('quarter). Full recovery (8h) restores all.');
    expect(text).not.toMatch(/\)\.\d/);
    expect(text).not.toMatch(/all\.\d/);
  });

  it('is the sentence the recovery modal renders', () => {
    const modal = readFileSync(
      path.join(import.meta.dirname, '../../components/character-sheet/recovery-modal.tsx'),
      'utf8',
    );
    expect(modal).toContain('formatPartialRecoveryDuration');
  });
});
