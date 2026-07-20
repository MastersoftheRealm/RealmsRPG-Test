import { describe, expect, it } from 'vitest';
import {
  applyTempModifier,
  applyTempModifiersToDisplayStats,
  getEffectiveAbilities,
  normalizeTempModifiers,
  patchTempModifiers,
  sectionHasTempModifiers,
  shouldApplyAbilityTempsToResourceMaxima,
  tempModifierValueClass,
  withAbilitiesForResourceMaxima,
} from './temp-modifiers';
import { DEFAULT_ABILITIES } from '@/types/abilities';

describe('temp-modifiers (ADR-0006)', () => {
  it('applyTempModifier stacks deltas and ignores zero/null', () => {
    expect(applyTempModifier(10, 2)).toBe(12);
    expect(applyTempModifier(10, -3)).toBe(7);
    expect(applyTempModifier(10, 0)).toBe(10);
    expect(applyTempModifier(10, null)).toBe(10);
    expect(applyTempModifier(10, undefined)).toBe(10);
  });

  it('tempModifierValueClass tints value only (warning/danger)', () => {
    expect(tempModifierValueClass(1)).toBe('text-warning-fg');
    expect(tempModifierValueClass(-1)).toBe('text-danger-fg');
    expect(tempModifierValueClass(0)).toBe('');
    expect(tempModifierValueClass(undefined)).toBe('');
  });

  it('normalizeTempModifiers drops zeros and empty maps', () => {
    expect(
      normalizeTempModifiers({
        speed: 0,
        evasion: 2,
        abilities: { strength: 0, vitality: 1 },
        skills: { athletics: 0, stealth: -1 },
        applyAbilityToResourceMaxima: false,
      })
    ).toEqual({
      evasion: 2,
      abilities: { vitality: 1 },
      skills: { stealth: -1 },
    });
    expect(normalizeTempModifiers({ speed: 0 })).toBeUndefined();
  });

  it('resource maxima opt-in defaults off', () => {
    expect(shouldApplyAbilityTempsToResourceMaxima(undefined)).toBe(false);
    expect(shouldApplyAbilityTempsToResourceMaxima({})).toBe(false);
    expect(
      shouldApplyAbilityTempsToResourceMaxima({ applyAbilityToResourceMaxima: true })
    ).toBe(true);
  });

  it('getEffectiveAbilities merges ability temps', () => {
    const base = { ...DEFAULT_ABILITIES, strength: 2, vitality: 1 };
    expect(
      getEffectiveAbilities(base, { abilities: { strength: 1, vitality: -1 } })
    ).toEqual({ ...base, strength: 3, vitality: 0 });
  });

  it('patchTempModifiers merges nested maps and normalizes', () => {
    expect(
      patchTempModifiers({ speed: 1, abilities: { strength: 2 } }, { abilities: { vitality: 1 } })
    ).toEqual({ speed: 1, abilities: { strength: 2, vitality: 1 } });
    expect(patchTempModifiers({ speed: 1 }, { speed: 0 })).toBeUndefined();
  });

  it('sectionHasTempModifiers scopes by section', () => {
    expect(sectionHasTempModifiers({ speed: 1 }, 'header')).toBe(true);
    expect(sectionHasTempModifiers({ speed: 1 }, 'abilities')).toBe(false);
    expect(sectionHasTempModifiers({ applyAbilityToResourceMaxima: true }, 'abilities')).toBe(true);
    expect(sectionHasTempModifiers({ skills: { a: 1 } }, 'skills')).toBe(true);
  });

  it('applyTempModifiersToDisplayStats layers scalars and optional resource override', () => {
    const base = { maxHealth: 20, maxEnergy: 10, terminal: 5, speed: 6, evasion: 12 };
    expect(applyTempModifiersToDisplayStats(base, { speed: 2, terminal: -1 })).toEqual({
      ...base,
      speed: 8,
      terminal: 4,
    });
    expect(
      applyTempModifiersToDisplayStats(
        base,
        { applyAbilityToResourceMaxima: true },
        { maxHealth: 24, maxEnergy: 12, terminal: 6 }
      )
    ).toEqual({
      maxHealth: 24,
      maxEnergy: 12,
      terminal: 6,
      speed: 6,
      evasion: 12,
    });
  });

  it('withAbilitiesForResourceMaxima is opt-in only', () => {
    const character = {
      abilities: { ...DEFAULT_ABILITIES, strength: 2 },
      tempModifiers: { abilities: { strength: 1 } },
    };
    expect(withAbilitiesForResourceMaxima(character)).toBe(character);
    expect(
      withAbilitiesForResourceMaxima({
        ...character,
        tempModifiers: { ...character.tempModifiers, applyAbilityToResourceMaxima: true },
      }).abilities.strength
    ).toBe(3);
  });
});
