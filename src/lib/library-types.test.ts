import { describe, expect, it } from 'vitest';
import { LIBRARY_ITEM_TYPES, type LibraryItemByType } from '../types/library';

describe('LibraryItemByType shape', () => {
  it('defines all official/user library collection keys', () => {
    const keys = LIBRARY_ITEM_TYPES;
    expect(keys).toContain('powers');
    expect(keys).toContain('techniques');
    expect(keys).toContain('empowered-techniques');
    expect(keys).toContain('items');
    expect(keys).toContain('creatures');
    expect(keys).toContain('species');
    expect(keys.length).toBe(6);
  });

  it('maps each library kind to a distinct item interface', () => {
    type Power = LibraryItemByType['powers'];
    type Technique = LibraryItemByType['techniques'];
    type Item = LibraryItemByType['items'];
    const power: Power = { id: '1', docId: '1', name: 'Test', parts: [] };
    const technique: Technique = { id: '2', docId: '2', name: 'Slash', parts: [] };
    const item: Item = { id: '3', docId: '3', name: 'Sword', type: 'weapon', properties: [] };
    expect(power.name).toBe('Test');
    expect(technique.name).toBe('Slash');
    expect(item.type).toBe('weapon');
  });
});
