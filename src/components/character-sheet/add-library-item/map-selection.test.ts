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
      type?: string;
      quantity?: number;
    }>;

    expect(items).toHaveLength(1);
    const item = defined(items[0]);
    expect(item.type).toBe('equipment');
    expect(item.quantity).toBe(3);
    expect(item.id).toBe(1);
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
      quantity?: number;
    }>;

    expect(defined(items[0]).quantity).toBe(2);
    expect(defined(items[1]).quantity).toBe(1);
  });
});
