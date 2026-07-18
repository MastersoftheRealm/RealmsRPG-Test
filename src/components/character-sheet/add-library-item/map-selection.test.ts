import { describe, expect, it } from 'vitest';
import { mapSelectedToCharacterItems } from './map-selection';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';

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
    expect(items[0].type).toBe('equipment');
    expect(items[0].quantity).toBe(3);
    expect(items[0].id).toBe(1);
  });
});
