import { describe, expect, it } from 'vitest';
import {
  buildTargetedDefenseSelectOptions,
  defensesFromPart,
  formatCanTargetLine,
  formatTargetsFact,
  normalizeTargetedDefenses,
  parseDefensesFromDescription,
  suggestTargetedDefenses,
} from './targeted-defenses';

describe('normalizeTargetedDefenses', () => {
  it('normalizes comma-separated TEXT and Evasion casing', () => {
    expect(normalizeTargetedDefenses('Resolve, Mental Fortitude')).toEqual([
      'Resolve',
      'Mental Fortitude',
    ]);
    expect(normalizeTargetedDefenses(['evasion', 'Might'])).toEqual(['Evasion', 'Might']);
  });
});

describe('defensesFromPart', () => {
  it('prefers defense field over description', () => {
    expect(
      defensesFromPart({
        name: 'Blind',
        defense: ['Fortitude'],
        description: 'Targets Resolve',
      }),
    ).toEqual(['Fortitude']);
  });

  it('falls back to description parse when defense empty', () => {
    expect(
      defensesFromPart({
        name: 'Goad',
        description: 'Make a Taunt Roll against a target’s Resolve',
      }),
    ).toEqual(['Resolve']);
  });

  it('does not treat Fortitude as a hit inside Mental Fortitude', () => {
    expect(
      parseDefensesFromDescription(
        'Targets your choice of Fortitude, Mental Fortitude, or Discernment',
      ),
    ).toEqual(['Fortitude', 'Discernment', 'Mental Fortitude']);
  });
});

describe('suggestTargetedDefenses', () => {
  it('includes Evasion for weapon and unarmed attack modes', () => {
    const weapon = suggestTargetedDefenses({ parts: [], attackMode: 'weapon' });
    expect(weapon.some((s) => s.defense === 'Evasion' && s.sources.includes('Weapon Attack'))).toBe(
      true,
    );

    const unarmed = suggestTargetedDefenses({ parts: [], attackMode: 'unarmed' });
    expect(
      unarmed.some((s) => s.defense === 'Evasion' && s.sources.includes('Unarmed Attack')),
    ).toBe(true);
  });

  it('suggests from selected parts and labels damage types by type name only', () => {
    const suggestions = suggestTargetedDefenses({
      parts: [{ name: 'Blind', defense: ['Fortitude'] }],
      partsDb: [
        { name: 'Blind', defense: ['Fortitude'] },
        { name: 'Elemental Damage', defense: ['Evasion'] },
        { name: 'Speak with the Dead', defense: ['Might'] },
      ],
      damageTypes: ['fire'],
      attackMode: 'none',
    });
    const byDefense = Object.fromEntries(suggestions.map((s) => [s.defense, s.sources]));
    expect(byDefense.Fortitude).toEqual(['Blind']);
    expect(byDefense.Evasion).toEqual(['Fire']);
    expect(byDefense.Might).toBeUndefined();
  });

  it('does not treat the full parts catalog as selected when parts is empty', () => {
    const suggestions = suggestTargetedDefenses({
      parts: [],
      partsDb: [
        { name: 'Blind', defense: ['Fortitude'] },
        { name: 'Speak with the Dead', defense: ['Might'] },
      ],
      attackMode: 'none',
    });
    expect(suggestions).toEqual([]);
  });

  it('marks dropdown labels with asterisk and this-entry sources only', () => {
    const options = buildTargetedDefenseSelectOptions({
      parts: [{ name: 'Blind', defense: ['Fortitude'] }],
      partsDb: [{ name: 'Speak with the Dead', defense: ['Might'] }],
      attackMode: 'none',
    });
    const fortitude = options.find((o) => o.value === 'Fortitude');
    const might = options.find((o) => o.value === 'Might');
    expect(fortitude?.label).toBe('Fortitude * · Blind');
    expect(might?.label).toBe('Might');
    expect(might?.suggested).toBe(false);
  });
});

describe('format helpers', () => {
  it('formatCanTargetLine and formatTargetsFact use canonical names', () => {
    expect(formatCanTargetLine(['fortitude', 'Resolve'])).toBe('Can target: Fortitude, Resolve');
    expect(formatTargetsFact(['Might', 'Evasion'])).toBe('Targets Might, Evasion');
    expect(formatTargetsFact([])).toBeUndefined();
  });
});
