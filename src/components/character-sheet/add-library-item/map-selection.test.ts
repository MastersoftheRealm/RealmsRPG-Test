import { describe, expect, it } from 'vitest';
import { defined } from '@/lib/utils';
import { mapSelectedToCharacterItems } from './map-selection';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';

describe('mapSelectedToCharacterItems (equipment)', () => {
  it('sets type equipment and resolves quantity from string id keys', () => {
    const selected: SelectableItem[] = [
      {
        id: '1',
        name: 'Rations',
        description: '1 day of rations.',
        columns: [],
        data: { id: 1, name: 'Rations', description: '1 day of rations.', properties: [] },
        quantity: 3,
      } as SelectableItem & { quantity: number },
    ];

    const items = mapSelectedToCharacterItems('equipment', selected, 'powers') as Array<{
      id: string | number;
      type?: string | undefined;
      quantity?: number | undefined;
    }>;

    expect(items).toHaveLength(1);
    const item = defined(items[0]);
    expect(item.type).toBe('equipment');
    expect(item.quantity).toBe(3);
    expect(item.id).toBe(1);
  });

  it('persists catalog currency, category, and rarity for equipment (TASK-873)', () => {
    const selected: SelectableItem[] = [
      {
        id: '10',
        name: 'Spyglass',
        description: 'A glass.',
        columns: [],
        data: {
          id: 10,
          name: 'Spyglass',
          description: 'A glass.',
          category: 'Adventuring',
          rarity: 'uncommon',
          currency: 20,
          properties: [],
        },
        quantity: 1,
      } as SelectableItem & { quantity: number },
    ];

    const items = mapSelectedToCharacterItems('equipment', selected, 'powers') as Array<{
      cost?: number | undefined;
      category?: string | undefined;
      rarity?: string | undefined;
    }>;

    const item = defined(items[0]);
    expect(item.cost).toBe(20);
    expect(item.category).toBe('Adventuring');
    expect(item.rarity).toBe('uncommon');
  });

  it('normalizes fractional/invalid quantities to at least 1 (DEV-V-009-T022)', () => {
    const selected: SelectableItem[] = [
      {
        id: '2',
        name: 'Rope',
        description: '',
        columns: [],
        data: { id: 2, name: 'Rope', description: '', properties: [] },
        quantity: 2.7,
      } as SelectableItem & { quantity: number },
      {
        id: '3',
        name: 'Spike',
        description: '',
        columns: [],
        data: { id: 3, name: 'Spike', description: '', properties: [] },
        quantity: Number.NaN,
      } as SelectableItem & { quantity: number },
    ];

    const items = mapSelectedToCharacterItems('equipment', selected, 'powers') as Array<{
      quantity?: number | undefined;
    }>;

    expect(defined(items[0]).quantity).toBe(2);
    expect(defined(items[1]).quantity).toBe(1);
  });
});
