import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canAddDamageModifier, takenDamageModifiers } from './creature-damage-modifiers';

const traitsSection = readFileSync(
  new URL('./creature-creator-editor-traits-section.tsx', import.meta.url),
  'utf8',
);

const empty = { resistances: [], weaknesses: [], immunities: [] };

describe('creature damage modifiers (86e3jx63d)', () => {
  it('blocks a weakness on a type the creature already resists', () => {
    const creature = { ...empty, resistances: ['fire'] };
    expect(canAddDamageModifier(creature, 'fire')).toBe(false);
    expect(takenDamageModifiers(creature)).toContain('fire');
  });

  it('blocks a weakness on a type the creature is already immune to', () => {
    const creature = { ...empty, immunities: ['cold'] };
    expect(canAddDamageModifier(creature, 'cold')).toBe(false);
  });

  it('blocks a resistance or immunity on a type that is already a weakness', () => {
    const creature = { ...empty, weaknesses: ['lightning'] };
    expect(canAddDamageModifier(creature, 'lightning')).toBe(false);
  });

  it('still allows a different damage type', () => {
    const creature = { ...empty, resistances: ['fire'], immunities: ['cold'] };
    expect(canAddDamageModifier(creature, 'sonic')).toBe(true);
  });

  it('hides taken types from the resistance, weakness, and immunity dropdowns', () => {
    const uses = traitsSection.match(/selectedItems=\{takenDamageTypes\}/g) ?? [];
    expect(uses).toHaveLength(3);
    expect(traitsSection).toContain('const takenDamageTypes = takenDamageModifiers(creature)');
  });
});
