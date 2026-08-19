import { describe, expect, it } from 'vitest';
import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
import {
  applyGuidedEquipmentL2Selection,
  buildGuidedEquipmentL2Items,
  changeGuidedEquipmentL2Quantity,
  computeL2GearSpend,
  computeL2TpSpent,
  toggleGuidedEquipmentL2Ref,
} from '@/lib/guided-creator/guided-equipment-l2';
import type {
  EligibleEquipmentRow,
  EquipmentEligibilityContext,
} from '@/lib/guided-creator/equipment-eligibility';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  ARMOR_L2_HEADER_COLUMNS,
  GEAR_L2_HEADER_COLUMNS,
  WEAPON_L2_HEADER_COLUMNS,
} from '@/components/guided-creator/guided-equipment-l2-grid';
import { GUIDED_POWERS_L2_HEADER_COLUMNS } from '@/lib/guided-creator/powers-techniques-l2';

const baseDraft: GuidedDraft = {
  creatorEntryMode: 'guided',
  pathLayer: 'l1' as const,
  archetypePathId: '1',
  archetypeType: 'martial',
  pow_abil: null,
  mart_abil: 'strength',
  speciesId: null,
  speciesName: null,
  speciesMixed: false,
  mixedSpeciesIds: null,
  mixedSpeciesNames: null,
  selectedSpeciesSkillIds: [],
  selectedSpeciesTraits: [],
  selectedFlawSpeciesId: null,
  selectedSize: null,
  selectedSpeciesTraitChoices: {},
  selectedAncestryTraitIds: [],
  selectedCharacteristicId: null,
  selectedFlawId: null,
  abilities: {
    strength: 3,
    vitality: 2,
    agility: 1,
    acuity: 1,
    intelligence: 0,
    charisma: 0,
  },
  abilitiesMode: null,
  skills: {},
  defenseVals: {
    might: 0,
    fortitude: 0,
    reflex: 0,
    discernment: 0,
    mentalFortitude: 0,
    resolve: 0,
  },
  skillAbilities: {},
  declinedPathSkillIds: [],
  archetypeFeatIds: [],
  characterFeatIds: [],
  equipmentPhase: 'weapon',
  powersPhase: 'innate',
  loadoutWeapons: [],
  loadoutArmor: [],
  armaments: [],
  equipment: [],
  currency: 200,
  unarmedProwess: 0,
  powerIds: [],
  innatePowerIds: [],
  techniqueIds: [],
  name: '',
  age: '',
  heightCm: null,
  weightKg: null,
  appearanceNotes: '',
  description: '',
  portraitUrl: null,
  hpAllocated: null,
  energyAllocated: null,
};

describe('guided-equipment-l2', () => {
  const catalog = new Map<string, EligibleEquipmentRow>([
    [
      'w1',
      {
        id: 'w1',
        name: 'Axe',
        type: 'weapon',
        rarity: 'common',
        trainingPoints: 4,
        gold_cost: 25,
        properties: [],
      },
    ],
    [
      'w2',
      {
        id: 'w2',
        name: 'Greataxe',
        type: 'weapon',
        rarity: 'common',
        trainingPoints: 6,
        properties: [{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed' }],
      },
    ],
    [
      'w3',
      {
        id: 'w3',
        name: 'Longbow',
        type: 'weapon',
        rarity: 'common',
        trainingPoints: 4,
        range: '0',
        properties: [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }],
      },
    ],
    [
      's1',
      {
        id: 's1',
        name: 'Shield',
        type: 'shield',
        rarity: 'common',
        trainingPoints: 2,
        properties: [],
      },
    ],
    [
      'a1',
      {
        id: 'a1',
        name: 'Chain',
        type: 'armor',
        rarity: 'common',
        trainingPoints: 10,
        gold_cost: 40,
        properties: [],
      },
    ],
    [
      'g1',
      {
        id: 'g1',
        name: 'Rope',
        type: 'equipment',
        itemCategory: 'Adventuring',
        rarity: 'common',
        trainingPoints: 0,
        gold_cost: 5,
        properties: [],
      },
    ],
    [
      'g2',
      {
        id: 'g2',
        name: 'Lockpicks',
        type: 'equipment',
        itemCategory: 'equipment',
        rarity: 'common',
        trainingPoints: 0,
        gold_cost: 8,
        properties: [],
      },
    ],
    [
      'g3',
      {
        id: 'g3',
        name: 'Toolkit',
        type: 'equipment',
        itemCategory: 'Tools',
        rarity: 'common',
        trainingPoints: 0,
        gold_cost: 12,
        properties: [],
      },
    ],
    [
      'g4',
      {
        id: 'g4',
        name: 'Sack',
        type: 'equipment',
        rarity: 'common',
        trainingPoints: 0,
        gold_cost: 2,
        properties: [],
      },
    ],
  ]);

  const ctx: EquipmentEligibilityContext = {
    phase: 'weapon',
    abilities: baseDraft.abilities,
    martAbil: 'strength',
    powAbil: null,
    archetypeType: 'martial',
    pathRecommendedIds: new Set(),
    selectedTpSpent: 0,
    tpLimit: 30,
  };

  it('rejects two-handed weapon with shield', () => {
    const selected = [
      {
        id: 'w2',
        name: 'Greataxe',
        data: { ref: { id: 'w2', quantity: 1 }, category: 'weapon', row: catalog.get('w2')! },
      },
      {
        id: 's1',
        name: 'Shield',
        data: { ref: { id: 's1', quantity: 1 }, category: 'weapon', row: catalog.get('s1')! },
      },
    ];
    const result = applyGuidedEquipmentL2Selection('weapon', baseDraft, selected, catalog, 30, 200);
    expect(result.ok).toBe(false);
  });

  it('includes armor TP when evaluating weapon phase spend', () => {
    const draft = {
      ...baseDraft,
      loadoutArmor: [{ id: 'a1', quantity: 1 }],
    };
    const spent = computeL2TpSpent(
      'weapon',
      draft,
      [
        {
          id: 'w1',
          name: 'Axe',
          data: { ref: { id: 'w1', quantity: 1 }, category: 'weapon', row: catalog.get('w1')! },
        },
      ],
      catalog,
    );
    expect(spent).toBe(14);
  });

  it('weapon L2 row columns match header keys (except name)', () => {
    const items = buildGuidedEquipmentL2Items('weapon', catalog, ctx, [], []);
    const axe = items.find((i) => i.id === 'w1');
    expect(axe).toBeTruthy();
    const rowKeys = (axe!.columns ?? []).map((c) => c.key);
    const headerKeys = WEAPON_L2_HEADER_COLUMNS.filter((c) => c.key !== 'name').map((c) => c.key);
    expect(rowKeys).toEqual(headerKeys);
    expect(axe!.columns?.find((c) => c.key === 'currency')?.value).toBe(25);
  });

  it('weapon expand uses Official Properties & Proficiencies, not card-stat Details (TASK-709)', () => {
    const items = buildGuidedEquipmentL2Items('weapon', catalog, ctx, [], []);
    for (const item of items) {
      const labels = item.detailSections?.map((s) => s.label) ?? [];
      expect(labels).not.toContain('Details');
    }
  });

  it('weapon range column derives from properties when stored range is corrupt (TASK-701)', () => {
    const items = buildGuidedEquipmentL2Items('weapon', catalog, ctx, [], []);
    const longbow = items.find((i) => i.id === 'w3');
    expect(longbow?.columns?.find((c) => c.key === 'range')?.value).toBe('16 spaces');
  });

  it('L2 header data columns are sortable', () => {
    for (const col of [
      ...WEAPON_L2_HEADER_COLUMNS,
      ...ARMOR_L2_HEADER_COLUMNS,
      ...GEAR_L2_HEADER_COLUMNS,
      ...GUIDED_POWERS_L2_HEADER_COLUMNS,
    ]) {
      expect(col.sortable).toBe(true);
    }
  });

  it('armor and gear L2 columns match their headers', () => {
    const armorItems = buildGuidedEquipmentL2Items(
      'armor',
      catalog,
      { ...ctx, phase: 'armor' },
      [],
      [],
    );
    const chain = armorItems.find((i) => i.id === 'a1');
    expect((chain!.columns ?? []).map((c) => c.key)).toEqual(
      ARMOR_L2_HEADER_COLUMNS.filter((c) => c.key !== 'name').map((c) => c.key),
    );

    const gearItems = buildGuidedEquipmentL2Items(
      'gear',
      catalog,
      { ...ctx, phase: 'gear', remainingCurrency: 200 },
      [],
      [],
    );
    const rope = gearItems.find((i) => i.id === 'g1');
    expect((rope!.columns ?? []).map((c) => c.key)).toEqual(
      GEAR_L2_HEADER_COLUMNS.filter((c) => c.key !== 'name').map((c) => c.key),
    );
    expect(rope!.columns?.find((c) => c.key === 'category')?.value).toBe('Adventuring');

    const lockpicks = gearItems.find((i) => i.id === 'g2');
    expect(lockpicks!.columns?.find((c) => c.key === 'category')?.value).toBe('-');
    expect(
      gearItems.find((i) => i.id === 'g3')?.columns?.find((c) => c.key === 'category')?.value,
    ).toBe('Tools');
    expect(
      gearItems.find((i) => i.id === 'g4')?.columns?.find((c) => c.key === 'category')?.value,
    ).toBe('-');
  });

  it('does not add a type-duplicate Category column on weapon/armor phases (TASK-724)', () => {
    const items = buildGuidedEquipmentL2Items('weapon', catalog, ctx, [], []);
    const axe = items.find((i) => i.id === 'w1');
    expect((axe!.columns ?? []).map((c) => c.key)).not.toContain('category');

    const armorItems = buildGuidedEquipmentL2Items(
      'armor',
      catalog,
      { ...ctx, phase: 'armor' },
      [],
      [],
    );
    const chain = armorItems.find((i) => i.id === 'a1');
    expect((chain!.columns ?? []).map((c) => c.key)).not.toContain('category');
  });

  it('gear Confirm allows spend up to full gear budget (reclaims current gear)', () => {
    const draft = {
      ...baseDraft,
      equipment: [{ id: 'g1', quantity: 1 }],
      currency: 195,
    };
    // Arms spent 0 → gear budget 200; replacing rope(5) with itself still ok.
    const result = applyGuidedEquipmentL2Selection(
      'gear',
      draft,
      [
        {
          id: 'g1',
          name: 'Rope',
          data: { ref: { id: 'g1', quantity: 1 }, category: 'equipment', row: catalog.get('g1')! },
        },
      ],
      catalog,
      30,
      200,
    );
    expect(result.ok).toBe(true);
  });

  it('weapon eligibility keeps room after reclaiming current-phase TP', () => {
    const tight = {
      ...ctx,
      selectedTpSpent: 0, // cross-phase only (armor empty)
      tpLimit: 6,
    };
    const items = buildGuidedEquipmentL2Items('weapon', catalog, tight, [], []);
    // Greataxe 6 TP alone still fits when cross-phase spend is 0
    expect(items.some((i) => i.id === 'w2')).toBe(true);
  });

  it('gear quantity multiplies Currency spend and Confirm preserves qty (DEV-V-013-T052)', () => {
    const selected = [
      {
        id: 'g1',
        name: 'Rope',
        quantity: 4,
        data: {
          ref: { id: 'g1', quantity: 1 },
          category: 'equipment' as const,
          row: catalog.get('g1')!,
        },
      },
    ];
    expect(computeL2GearSpend(selected)).toBe(20);

    const result = applyGuidedEquipmentL2Selection('gear', baseDraft, selected, catalog, 30, 200);
    expect(result.ok).toBe(true);
    expect(result.partial?.equipment).toEqual([{ id: 'g1', quantity: 4 }]);
  });

  it('gear Confirm rejects over-budget quantity; empty selection clears gear (DEV-V-013-T052)', () => {
    const overBudgetSelection: Array<SelectableItem & { quantity?: number | undefined }> = [
      {
        id: 'g1',
        name: 'Rope',
        quantity: 50,
        data: {
          ref: { id: 'g1', quantity: 1 },
          category: 'equipment' as const,
          row: catalog.get('g1')!,
        },
      },
    ];
    const over = applyGuidedEquipmentL2Selection(
      'gear',
      baseDraft,
      overBudgetSelection,
      catalog,
      30,
      200,
    );
    expect(over.ok).toBe(false);

    const cleared = applyGuidedEquipmentL2Selection(
      'gear',
      { ...baseDraft, equipment: [{ id: 'g1', quantity: 2 }] },
      [],
      catalog,
      30,
      200,
    );
    expect(cleared.ok).toBe(true);
    expect(cleared.partial?.equipment).toEqual([]);
  });

  it('toggleGuidedEquipmentL2Ref rejects two-handed + shield and applies remove', () => {
    const withShield = {
      ...baseDraft,
      loadoutWeapons: [
        { id: 'w2', quantity: 1 },
        { id: 's1', quantity: 1 },
      ],
    };
    const rejected = toggleGuidedEquipmentL2Ref(
      'weapon',
      { ...baseDraft, loadoutWeapons: [{ id: 's1', quantity: 1 }] },
      'w2',
      catalog,
      30,
      200,
    );
    expect(rejected.ok).toBe(false);

    const removed = toggleGuidedEquipmentL2Ref('weapon', withShield, 's1', catalog, 30, 200);
    expect(removed.ok).toBe(true);
    expect(removed.partial?.loadoutWeapons).toEqual([{ id: 'w2', quantity: 1 }]);
  });

  it('changeGuidedEquipmentL2Quantity clamps and rejects over-budget gear', () => {
    const draft = {
      ...baseDraft,
      equipment: [{ id: 'g1', quantity: 2 }],
    };
    const bumped = changeGuidedEquipmentL2Quantity('gear', draft, 'g1', 1, catalog, 30, 200);
    expect(bumped.ok).toBe(true);
    expect(bumped.partial?.equipment).toEqual([{ id: 'g1', quantity: 3 }]);

    const over = changeGuidedEquipmentL2Quantity('gear', draft, 'g1', 50, catalog, 30, 200);
    expect(over.ok).toBe(false);

    const cleared = changeGuidedEquipmentL2Quantity('gear', draft, 'g1', -99, catalog, 30, 200);
    expect(cleared.ok).toBe(true);
    expect(cleared.partial?.equipment).toEqual([]);
  });
});
