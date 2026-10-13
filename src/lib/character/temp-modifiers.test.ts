import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyTempModifier,
  applyTempModifiersToDisplayStats,
  getEffectiveAbilities,
  hasAnyTempModifiers,
  normalizeTempModifiers,
  sectionTempModifierTint,
  tempModifierTintFromDelta,
  patchTempModifiers,
  sectionHasTempModifiers,
  TEMP_MODIFIER_MAX,
  TEMP_MODIFIER_MIN,
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
      }),
    ).toEqual({
      evasion: 2,
      abilities: { vitality: 1 },
      skills: { stealth: -1 },
    });
    expect(normalizeTempModifiers({ speed: 0 })).toBeUndefined();
  });

  it('clamps temp modifiers to −99 and +1000 (86e3jvcgg)', () => {
    expect(TEMP_MODIFIER_MIN).toBe(-99);
    expect(TEMP_MODIFIER_MAX).toBe(1000);
    expect(
      normalizeTempModifiers({
        speed: -105,
        evasion: 1001,
        abilities: { strength: -99, vitality: 1000 },
        defenses: { might: -200 },
        skills: { acrobatics: -105, athletics: 5000 },
      }),
    ).toEqual({
      speed: -99,
      evasion: 1000,
      abilities: { strength: -99, vitality: 1000 },
      defenses: { might: -99 },
      skills: { acrobatics: -99, athletics: 1000 },
    });
    expect(
      patchTempModifiers({ skills: { acrobatics: -99 } }, { skills: { acrobatics: -100 } }),
    ).toEqual({ skills: { acrobatics: -99 } });

    const root = path.join(import.meta.dirname, '../..');
    const skills = readFileSync(
      path.join(root, 'components/character-sheet/skills-section.tsx'),
      'utf8',
    );
    const row = readFileSync(path.join(root, 'components/patterns/list/skill-row.tsx'), 'utf8');
    expect(skills).toContain('TEMP_MODIFIER_MIN');
    expect(skills).toContain('TEMP_MODIFIER_MAX');
    expect(skills).toContain('maxValue={showTempControls ? TEMP_MODIFIER_MAX : undefined}');
    expect(row).toContain('maxValue !== undefined ? minValue : proficient ? -Infinity : minValue');
    expect(row).toContain('maxValue !== undefined ? maxValue : canIncrease ? undefined : value');
  });

  it('tempModifierTintFromDelta matches value gold/danger', () => {
    expect(tempModifierTintFromDelta(undefined)).toBe('none');
    expect(tempModifierTintFromDelta(0)).toBe('none');
    expect(tempModifierTintFromDelta(2)).toBe('positive');
    expect(tempModifierTintFromDelta(-1)).toBe('negative');
  });

  it('sectionTempModifierTint is gold for +, danger for −, gold when mixed', () => {
    expect(sectionTempModifierTint(undefined, 'header')).toBe('none');
    expect(sectionTempModifierTint({ speed: 1 }, 'header')).toBe('positive');
    expect(sectionTempModifierTint({ evasion: -2 }, 'header')).toBe('negative');
    expect(sectionTempModifierTint({ speed: 1, evasion: -1 }, 'header')).toBe('positive');
    expect(sectionTempModifierTint({ abilities: { strength: -1 } }, 'abilities')).toBe('negative');
    expect(sectionTempModifierTint({ skills: { stealth: 2 } }, 'skills')).toBe('positive');
  });

  it('hasAnyTempModifiers is true only when normalize keeps a key', () => {
    expect(hasAnyTempModifiers(undefined)).toBe(false);
    expect(hasAnyTempModifiers({ speed: 0 })).toBe(false);
    expect(hasAnyTempModifiers({ speed: 1 })).toBe(true);
    expect(hasAnyTempModifiers({ applyAbilityToResourceMaxima: true })).toBe(true);
  });

  it('resource maxima opt-in defaults off', () => {
    expect(shouldApplyAbilityTempsToResourceMaxima(undefined)).toBe(false);
    expect(shouldApplyAbilityTempsToResourceMaxima({})).toBe(false);
    expect(shouldApplyAbilityTempsToResourceMaxima({ applyAbilityToResourceMaxima: true })).toBe(
      true,
    );
  });

  it('getEffectiveAbilities merges ability temps', () => {
    const base = { ...DEFAULT_ABILITIES, strength: 2, vitality: 1 };
    expect(getEffectiveAbilities(base, { abilities: { strength: 1, vitality: -1 } })).toEqual({
      ...base,
      strength: 3,
      vitality: 0,
    });
  });

  it('patchTempModifiers merges nested maps and normalizes', () => {
    expect(
      patchTempModifiers({ speed: 1, abilities: { strength: 2 } }, { abilities: { vitality: 1 } }),
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
        { maxHealth: 24, maxEnergy: 12, terminal: 6 },
      ),
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
      }).abilities.strength,
    ).toBe(3);
  });
});
