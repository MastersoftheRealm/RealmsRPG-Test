import { describe, expect, it } from 'vitest';
import type { PathLoadout } from '@/types/archetype';
import {
  buildEquipmentLookup,
  draftArmamentRefs,
  groupResolvedItemsByCategory,
  loadoutDraftFromSelection,
  pruneUnresolvedLoadoutRefs,
  rebucketLoadoutByLookup,
  resolveDraftArmaments,
  resolveLoadoutItems,
} from '@/lib/guided-creator/resolve-loadout-items';

const GREATSword = '486b9ac9-16e3-49f8-80de-6d4c9ebbf3bc';
const SCALEMAIL = '8ca40c97-851c-4381-a6dd-e0724a6927cf';

describe('resolve-loadout-items', () => {
  const lookup = buildEquipmentLookup(
    [
      {
        id: GREATSword,
        docId: GREATSword,
        name: 'Greatsword',
        type: 'weapon',
        properties: [],
        damage: [{ amount: 1, size: 8, type: 'slashing' }],
      },
    ],
    [
      {
        id: '3',
        name: 'Bandage',
        type: 'equipment',
        description: 'Stabilizes wounds.',
        gold_cost: 0,
        currency: 0,
        properties: [],
      },
    ]
  );

  const loadout: PathLoadout = {
    id: 'test-kit',
    title: 'Test kit',
    armaments: [{ id: GREATSword, quantity: 1 }],
    armor: [{ id: SCALEMAIL, quantity: 1 }],
    equipment: [{ id: '3', quantity: 4 }],
  };

  it('resolves official and codex items by id', () => {
    const items = resolveLoadoutItems(loadout, lookup);
    expect(items).toHaveLength(3);
    expect(items[0]?.name).toBe('Greatsword');
    expect(items[0]?.categoryLabel).toBe('Weapon');
    expect(items[2]?.name).toBe('Bandage');
    expect(items[2]?.quantity).toBe(4);
  });

  it('marks missing refs as unresolved', () => {
    const items = resolveLoadoutItems(loadout, lookup, 'Missing');
    const armor = items.find((i) => i.id === SCALEMAIL);
    expect(armor?.name).toBe('Missing');
    expect(armor?.resolved).toBe(false);
  });

  it('maps loadout selection to draft armaments and equipment', () => {
    expect(loadoutDraftFromSelection(loadout)).toEqual({
      loadoutWeapons: [{ id: GREATSword, quantity: 1 }],
      loadoutArmor: [{ id: SCALEMAIL, quantity: 1 }],
      armaments: [
        { id: GREATSword, quantity: 1 },
        { id: SCALEMAIL, quantity: 1 },
      ],
      equipment: [{ id: '3', quantity: 4 }],
    });
  });

  it('splits armor nested in armaments[] when lookup is provided', () => {
    const nestedArmorKit: PathLoadout = {
      id: 'sword-board',
      title: 'Sword & shield',
      armaments: [
        { id: GREATSword, quantity: 1 },
        { id: SCALEMAIL, quantity: 1 },
      ],
      equipment: [{ id: '3', quantity: 4 }],
    };
    const lookupWithArmor = buildEquipmentLookup(
      [
        {
          id: GREATSword,
          docId: GREATSword,
          name: 'Greatsword',
          type: 'weapon',
          properties: [],
          damage: [{ amount: 1, size: 8, type: 'slashing' }],
        },
        {
          id: SCALEMAIL,
          docId: SCALEMAIL,
          name: 'Scalemail',
          type: 'armor',
          properties: [],
          damageReduction: 14,
        },
      ],
      []
    );
    expect(loadoutDraftFromSelection(nestedArmorKit, lookupWithArmor)).toEqual({
      loadoutWeapons: [{ id: GREATSword, quantity: 1 }],
      loadoutArmor: [{ id: SCALEMAIL, quantity: 1 }],
      armaments: [
        { id: GREATSword, quantity: 1 },
        { id: SCALEMAIL, quantity: 1 },
      ],
      equipment: [{ id: '3', quantity: 4 }],
    });
  });

  it('rebuckets misclassified armor out of weapons for custom drafts', () => {
    const lookupWithArmor = buildEquipmentLookup(
      [
        {
          id: GREATSword,
          docId: GREATSword,
          name: 'Greatsword',
          type: 'weapon',
          properties: [],
          damage: [{ amount: 1, size: 8, type: 'slashing' }],
        },
        {
          id: SCALEMAIL,
          docId: SCALEMAIL,
          name: 'Scalemail',
          type: 'armor',
          properties: [],
          damageReduction: 14,
        },
      ],
      []
    );
    expect(
      rebucketLoadoutByLookup(
        [
          { id: GREATSword, quantity: 1 },
          { id: SCALEMAIL, quantity: 1 },
        ],
        [],
        lookupWithArmor
      )
    ).toEqual({
      loadoutWeapons: [{ id: GREATSword, quantity: 1 }],
      loadoutArmor: [{ id: SCALEMAIL, quantity: 1 }],
      armaments: [
        { id: GREATSword, quantity: 1 },
        { id: SCALEMAIL, quantity: 1 },
      ],
    });
  });

  it('prunes unresolved loadout refs when lookup is ready', () => {
    const lookup = buildEquipmentLookup(
      [
        {
          id: GREATSword,
          docId: GREATSword,
          name: 'Greatsword',
          type: 'weapon',
          properties: [],
          damage: [{ amount: 1, size: 8, type: 'slashing' }],
        },
      ],
      []
    );
    expect(
      pruneUnresolvedLoadoutRefs(
        [
          { id: GREATSword, quantity: 1 },
          { id: 'stale-kit-id', quantity: 1 },
        ],
        lookup
      )
    ).toEqual([{ id: GREATSword, quantity: 1 }]);
  });

  it('groups resolved items by category for section display', () => {
    const lookupWithArmor = buildEquipmentLookup(
      [
        {
          id: GREATSword,
          docId: GREATSword,
          name: 'Greatsword',
          type: 'weapon',
          properties: [],
          damage: [{ amount: 1, size: 8, type: 'slashing' }],
        },
        {
          id: SCALEMAIL,
          docId: SCALEMAIL,
          name: 'Scalemail',
          type: 'armor',
          properties: [],
          damageReduction: 14,
        },
      ],
      [
        {
          id: '3',
          name: 'Bandage',
          type: 'equipment',
          description: 'Stabilizes wounds.',
          gold_cost: 0,
          currency: 0,
          properties: [],
        },
      ]
    );
    const items = resolveLoadoutItems(loadout, lookupWithArmor);
    const groups = groupResolvedItemsByCategory(items);
    expect(groups.map((g) => g.id)).toEqual(['weapons', 'armor', 'gear']);
    expect(groups[0]?.items[0]?.name).toBe('Greatsword');
    expect(groups[1]?.items[0]?.name).toBe('Scalemail');
    expect(groups[2]?.items[0]?.name).toBe('Bandage');
  });

  it('indexes official items by docId and matches draft ids case-insensitively', () => {
    const lookup = buildEquipmentLookup(
      [
        {
          id: 'lib-row',
          docId: GREATSword,
          name: 'Custom Greatsword',
          type: 'weapon',
          properties: [],
        },
      ],
      []
    );
    const items = resolveDraftArmaments(
      {
        loadoutWeapons: [{ id: GREATSword.toUpperCase(), quantity: 1 }],
        loadoutArmor: [],
        armaments: [{ id: 'stale-uuid', quantity: 1 }],
      },
      lookup
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Custom Greatsword');
    expect(items[0]?.resolved).toBe(true);
  });

  it('prefers phased weapon/armor buckets over stale armaments', () => {
    expect(
      draftArmamentRefs({
        loadoutWeapons: [{ id: GREATSword, quantity: 1 }],
        loadoutArmor: [{ id: SCALEMAIL, quantity: 1 }],
        armaments: [{ id: 'stale-uuid', quantity: 1 }],
      }).map((r) => r.id)
    ).toEqual([GREATSword, SCALEMAIL]);
  });

  it('falls back to legacy armaments when phased buckets are empty', () => {
    expect(
      draftArmamentRefs({
        loadoutWeapons: [],
        loadoutArmor: [],
        armaments: [{ id: GREATSword, quantity: 1 }],
      })
    ).toEqual([{ id: GREATSword, quantity: 1 }]);
  });
});
