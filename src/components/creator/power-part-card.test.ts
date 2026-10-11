import { describe, expect, it } from 'vitest';
import { creatorPartOptionLabel } from './power-part-card';

describe('creator part option labels (86e3jpq36)', () => {
  const vitality = { id: '40', name: 'Brace', category: 'Vitality' };
  const actions = { id: '211', name: 'Brace', category: 'Actions' };
  const potency = { id: '4', name: 'Potency Increase', category: 'Attack' };

  it('adds the category when All Categories lists the same name twice', () => {
    const list = [vitality, actions, potency];
    expect(creatorPartOptionLabel(vitality, list)).toBe('Brace (Vitality)');
    expect(creatorPartOptionLabel(actions, list)).toBe('Brace (Actions)');
    expect(creatorPartOptionLabel(potency, list)).toBe('Potency Increase');
  });

  it('keeps the name when the open category has one copy', () => {
    expect(creatorPartOptionLabel(actions, [actions])).toBe('Brace');
  });
});
