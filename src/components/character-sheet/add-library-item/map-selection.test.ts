import { describe, expect, it } from 'vitest';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import { defined } from '@/lib/utils';
import { PART_IDS } from '@/lib/id-constants';
import { buildRequiredProficiencies } from '@/lib/proficiencies';
import type { CharacterPower } from '@/types';
import { mapSelectedToCharacterItems } from './map-selection';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';

describe('mapSelectedToCharacterItems (composed power)', () => {
  it('adds every Choice variant damage type to the required proficiencies (TASK-934)', () => {
    const powerPartsDb = snapshotParts([PART_IDS.ELEMENTAL_DAMAGE, PART_IDS.POWER_RANGE]);
    const d10 = (type: string) => [{ amount: 1, size: 10, type }];
    const burst = {
      id: 'burst',
      name: 'Elemental Burst',
      actionType: 'basic',
      range: { steps: 3 },
      parts: [],
      composition: {
        structure: 'choice',
        variants: [
          { id: 'fire', label: 'Fire', damage: d10('fire') },
          { id: 'ice', label: 'Ice', damage: d10('ice') },
          { id: 'lightning', label: 'Lightning', damage: d10('lightning') },
        ],
      },
    };
    const selected = [{ id: 'burst', name: 'Elemental Burst', columns: [], data: burst }];
    const powers = mapSelectedToCharacterItems(
      'power',
      selected as unknown as SelectableItem[],
      'powers',
      { powerPartsDb, techniquePartsDb: [], itemPropertiesDb: [] },
    ) as CharacterPower[];
    const required = buildRequiredProficiencies({
      powers,
      techniques: [],
      weapons: [],
      armor: [],
      powerPartsDb,
    });
    expect(
      required
        .map((p) => p.damageType)
        .filter(Boolean)
        .sort(),
    ).toEqual(['fire', 'ice', 'lightning']);
    expect(required.filter((p) => p.name === 'Power Range')).toHaveLength(1);
  });
});

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
